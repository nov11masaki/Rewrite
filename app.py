from flask import Flask, render_template, request, jsonify
import re
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None
    print("警告: GEMINI_API_KEYが設定されていません。フォールバック機能を使用します。")

def simplify_japanese_with_gemini(text):
    """Use Gemini to rewrite Japanese text for easier translation"""
    if not model:
        return simplify_japanese_heuristic(text), 50
    
    try:
        prompt = f"""あなたは日本語を英訳しやすい形に書き換える専門家です。

以下の日本語の文を、英語に翻訳しやすい日本語に書き換えてください。

重要なルール：
- 文の長さは変えなくても構いません（短くする必要はありません）
- 主語と述語を明確にする
- 修飾語と被修飾語の関係を明確にする
- 曖昧な表現を具体的にする
- 日本語特有の省略を補完する
- 受動態より能動態を優先する
- 二重否定を避ける
- 一文一義を心がける
- 説明や前置きは不要。書き換えた文のみを出力してください

元の文：
{text}

英訳しやすい日本語："""
        
        response = model.generate_content(prompt)
        simplified = response.text.strip()
        
        # AI判断: 翻訳しやすさのスコアを取得
        score_prompt = f"""以下の2つの日本語文を比較して、2つ目の文が英語に翻訳しやすくなっているか評価してください。

元の文：
{text}

書き換えた文：
{simplified}

0-100のスコアで評価してください（100が最も翻訳しやすい）。
数値のみを出力してください。"""
        
        score_response = model.generate_content(score_prompt)
        try:
            score = int(''.join(filter(str.isdigit, score_response.text)))
            score = min(100, max(0, score))
        except:
            score = 75  # Default score if parsing fails
        
        return simplified, score
    except Exception as e:
        print(f"Gemini API error: {e}")
        return simplify_japanese_heuristic(text), 50

def simplify_japanese_heuristic(text):
    """Fallback heuristic simplifier"""
    s = re.sub(r"\s+", " ", text.strip())
    s = s.replace("ので", "から")
    parts = re.split(r"(?<=。|、|．|,)", s)
    simplified = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if len(p) > 40:
            p = re.sub(r"(、|，)", "。", p)
            clauses = re.split(r"。", p)
            for c in clauses:
                c = c.strip()
                if c:
                    simplified.append(c + "。" if not c.endswith("。") else c)
        else:
            simplified.append(p)
    return "\n".join(simplified)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simplify', methods=['POST'])
def simplify():
    data = request.json or {}
    text = data.get('text', '')
    if not text:
        return jsonify({'ok': False, 'error': 'テキストが空です'})
    simplified, score = simplify_japanese_with_gemini(text)
    return jsonify({'ok': True, 'simplified': simplified, 'score': score})

@app.route('/assist_translate', methods=['POST'])
def assist_translate():
    data = request.json or {}
    simplified = data.get('simplified', '')
    learner = data.get('learner', '')
    if not simplified:
        return jsonify({'ok': False, 'error': 'まず文章を簡素化してください'})
    
    # Use Gemini for translation assistance
    if model and len(learner.strip()) < 10:
        try:
            prompt = f"""以下の簡素化された日本語を英語に翻訳してください。
自然で正確な英語にしてください。

日本語：
{simplified}

英語："""
            response = model.generate_content(prompt)
            suggestion = response.text.strip()
        except Exception as e:
            print(f"Gemini API error: {e}")
            suggestion = translate_heuristic(simplified)
    else:
        suggestion = learner if learner.strip() else translate_heuristic(simplified)
    
    return jsonify({'ok': True, 'suggestion': suggestion})

def translate_heuristic(text):
    """Fallback heuristic translation"""
    clauses = [c.strip('。') for c in re.split(r"\n+", text) if c.strip()]
    translated_clauses = []
    for c in clauses:
        c_eng = c
        c_eng = c_eng.replace('私は', 'I')
        c_eng = c_eng.replace('です', 'is')
        c_eng = c_eng.replace('だ', 'is')
        c_eng = c_eng.replace('行きます', 'go')
        c_eng = c_eng.replace('行った', 'went')
        translated_clauses.append(c_eng)
    return ' '.join(translated_clauses)

if __name__ == '__main__':
    app.run(debug=True)
