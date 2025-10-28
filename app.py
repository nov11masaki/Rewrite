from flask import Flask, render_template, request, jsonify
import re
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure OpenAI API
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
else:
    client = None
    print("警告: OPENAI_API_KEYが設定されていません。フォールバック機能を使用します。")

def evaluate_rewrite_with_openai(original, rewritten):
    """Evaluate learner's rewritten text for translation readiness"""
    if not client:
        return 50, "AIが利用できないため、簡易評価を行いました。"
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたは日本語から英語への翻訳の専門家です。"},
                {"role": "user", "content": f"""学習者が元の日本語文を、英訳しやすい形に書き換えました。
この書き換えが英訳に適しているか評価してください。

元の文：
{original}

学習者が書き換えた文：
{rewritten}

評価基準：
- 英訳しやすい構造になっているか
- 一文一義になっているか

0-100のスコアで評価し、簡単なコメントを添えてください。
以下の形式で出力してください：

スコア: [数値]
コメント: [改善点や良い点を簡潔に]"""}
            ],
            temperature=0.7
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse score and comment
        score = 75  # default
        comment = ""
        
        lines = result.split('\n')
        for line in lines:
            if 'スコア' in line or 'score' in line.lower():
                digits = ''.join(filter(str.isdigit, line))
                if digits:
                    score = min(100, max(0, int(digits)))
            elif 'コメント' in line or 'comment' in line.lower():
                comment = line.split(':', 1)[-1].strip()
            elif comment == "" and line.strip() and not 'スコア' in line:
                # If no comment marker found, use the line as comment
                comment = line.strip()
        
        return score, comment
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return 50, "評価中にエラーが発生しました。"

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
    """Generate multiple rewrite candidates for easier translation"""
    data = request.json or {}
    text = data.get('text', '')
    temperature = data.get('temperature', 0.7)
    
    # Validate temperature
    try:
        temperature = float(temperature)
        temperature = max(0.0, min(1.0, temperature))
    except:
        temperature = 0.7
    
    if not text:
        return jsonify({'ok': False, 'error': 'テキストが空です'})
    
    if not client:
        # Fallback: return heuristic simplification as single candidate
        simplified = simplify_japanese_heuristic(text)
        return jsonify({
            'ok': True,
            'candidates': [
                {'id': 1, 'text': simplified, 'explanation': 'ヒューリスティック法による簡素化'}
            ]
        })
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたは日本語から英語への翻訳を支援する専門家です。必ず日本語で応答してください。慣用句やことわざは具体的な意味に言い換えてください。"},
                {"role": "user", "content": f"""以下の日本語文を、英訳しやすい形に書き換えた候補を3〜5個生成してください。
**重要: すべて日本語で出力してください。英語は使わないでください。**

元の文：
{text}

最重要要件：
- **慣用句・ことわざ・比喩表現は、その具体的な意味を平易な日本語で説明してください**
  例：「転ばぬ先の杖」→「事前に備えておくこと」「前もって準備すること」など
  例：「石の上にも三年」→「長い間努力を続ければ成功する」など
- **各候補は必ず異なる文構造で表現してください**
- **意味は完全に同じに保ってください（内容を変えない）**
- 単に語順を変えるだけでなく、文の組み立て方そのものを変えること
- 抽象的な表現は具体的に、複雑な表現はシンプルに

その他の要件：
- 入力が複数の文から成る場合、それぞれの文を考慮して全体を書き換える
- 一文一義を心がけ、長い文は短く分割することも検討
- 主語や目的語を明確にする
- 複雑な構文を避け、英訳しやすいシンプルな構造にする
- 各候補には「どのように文構造を変えたか」を説明

構造変換の例：
- 受動態→能動態（またはその逆）
- 名詞文→動詞文
- 複文→単文の連続
- 時系列の順序を変える
- 主語を変える（視点を変える）
- 慣用句→直接的な表現

以下の形式で日本語で出力してください：

候補1: [書き換え文（日本語）]
説明1: [どのように文構造を変えたか（日本語）]

候補2: [書き換え文（日本語）]
説明2: [どのように文構造を変えたか（日本語）]

候補3: [書き換え文（日本語）]
説明3: [どのように文構造を変えたか（日本語）]

（必要に応じて候補4、候補5も）"""}
            ],
            temperature=temperature
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse candidates
        candidates = []
        lines = result.split('\n')
        current_candidate = None
        current_explanation = None
        candidate_id = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if line.startswith('候補') and ':' in line:
                # Save previous candidate if exists
                if current_candidate:
                    candidate_id += 1
                    candidates.append({
                        'id': candidate_id,
                        'text': current_candidate,
                        'explanation': current_explanation or ''
                    })
                
                # Start new candidate
                current_candidate = line.split(':', 1)[1].strip()
                current_explanation = None
                
            elif line.startswith('説明') and ':' in line:
                current_explanation = line.split(':', 1)[1].strip()
        
        # Don't forget the last candidate
        if current_candidate:
            candidate_id += 1
            candidates.append({
                'id': candidate_id,
                'text': current_candidate,
                'explanation': current_explanation or ''
            })
        
        # If parsing failed, provide at least one fallback
        if not candidates:
            candidates = [{
                'id': 1,
                'text': simplify_japanese_heuristic(text),
                'explanation': 'フォールバック: 簡素化された文'
            }]
        
        return jsonify({'ok': True, 'candidates': candidates})
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        # Fallback
        simplified = simplify_japanese_heuristic(text)
        return jsonify({
            'ok': True,
            'candidates': [
                {'id': 1, 'text': simplified, 'explanation': 'エラー時のフォールバック'}
            ]
        })

@app.route('/assist_translate', methods=['POST'])
def assist_translate():
    data = request.json or {}
    simplified = data.get('simplified', '')
    learner = data.get('learner', '')
    if not simplified:
        return jsonify({'ok': False, 'error': 'まず文章を簡素化してください'})
    
    # Use OpenAI for translation assistance
    if client and len(learner.strip()) < 10:
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "あなたは日本語から英語への翻訳の専門家です。"},
                    {"role": "user", "content": f"""以下の日本語を英語に翻訳してください。
自然で正確な英語にしてください。

日本語：
{simplified}

英語："""}
                ],
                temperature=0.7
            )
            suggestion = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI API error: {e}")
            suggestion = translate_heuristic(simplified)
    else:
        suggestion = learner if learner.strip() else translate_heuristic(simplified)
    
    return jsonify({'ok': True, 'suggestion': suggestion})

@app.route('/evaluate_translation', methods=['POST'])
def evaluate_translation():
    data = request.json or {}
    original = data.get('original', '')
    simplified = data.get('simplified', '')
    translation = data.get('translation', '')
    
    if not translation:
        return jsonify({'ok': False, 'error': '英訳を入力してください'})
    
    if not client:
        return jsonify({'ok': True, 'score': 50, 'comment': 'AIが利用できないため、評価できません。'})
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたは英語翻訳の専門家です。"},
                {"role": "user", "content": f"""学習者が日本語を英語に翻訳しました。この翻訳を評価してください。

元の日本語：
{original}

書き換えた日本語：
{simplified}

学習者の英訳：
{translation}

評価基準：
- 文構造が

0-100のスコアで評価し、具体的なフィードバックを提供してください。
以下の形式で出力してください：

スコア: [数値]
コメント: [良い点と改善点を具体的に。文法ミスがあれば指摘。より良い表現があれば提案。]"""}
            ],
            temperature=0.7
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse score and comment
        score = 75  # default
        comment = ""
        
        lines = result.split('\n')
        for i, line in enumerate(lines):
            if 'スコア' in line or 'score' in line.lower():
                digits = ''.join(filter(str.isdigit, line))
                if digits:
                    score = min(100, max(0, int(digits)))
            elif 'コメント' in line or 'comment' in line.lower():
                comment = '\n'.join(lines[i:]).split(':', 1)[-1].strip()
                break
        
        if not comment:
            comment = result
        
        return jsonify({'ok': True, 'score': score, 'comment': comment})
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return jsonify({'ok': True, 'score': 50, 'comment': '評価中にエラーが発生しました。'})

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
    app.run(debug=True, port=5001)
