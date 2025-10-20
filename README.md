# 和文英訳 支援アプリ

学習者向けの和文英訳支援アプリです。日本語の文をまずAIが「翻訳しやすい日本語」に書き換え、その判断もAIが行います。学習者は書き換えられた日本語を見て自分で英訳を試み、難しい場合はAIが補助翻訳を提案します。

**例**: 「石の上にも三年」→ AIが翻訳しやすい日本語に変換 → 学習者が英訳

段階的に進めるUIで、同一ページ内で以下のフローを実現：
1. 日本語入力
2. **AIが翻訳しやすい日本語に変換（文の長さは変えず、翻訳しやすさを重視）**
3. 変換結果の確認（OK or やり直し）
4. 学習者が英訳にチャレンジ
5. 最終確認

**Google Gemini API** を使って高品質な変換と翻訳補助を提供します。

## セットアップ

### 前提条件
- Python 3.8以上
- Gemini APIキー（[Google AI Studio](https://makersuite.google.com/app/apikey)で取得）

1. 仮想環境を作成・有効化

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. 依存関係をインストール

```bash
pip install -r requirements.txt
```

3. Gemini APIキーを設定（必須）

[Google AI Studio](https://makersuite.google.com/app/apikey) でAPIキーを取得してください。

`.env` ファイルにAPIキーを記入：

```bash
GEMINI_API_KEY=your_api_key_here
```

**重要**: APIキーがない場合は簡易的なルールベース処理で動作しますが、翻訳しやすさの判断が不正確になります。

4. アプリを起動

```bash
python3 app.py
```

5. ブラウザで開く

http://127.0.0.1:5000/

## 構成
- `app.py`: Flaskバックエンド。Gemini APIを使った変換と翻訳補助のエンドポイントを持ちます。
- `templates/index.html`: シングルページのUI（段階的に進行）
- `static/style.css`, `static/main.js`: フロントエンドのスタイルと動作

## 機能
- ✅ 同一ページで段階的に進むUI制御
- ✅ **Gemini AIが翻訳しやすい日本語に変換（文の長さは変えず、翻訳しやすさを重視）**
- ✅ **AIが翻訳しやすさをスコア評価（0-100）**
- ✅ 簡素化→確認→英訳の順で進む（いきなり英訳には進めない）
- ✅ Gemini APIによる自然な英訳提案
- ✅ APIキーがない場合のフォールバック機能

## 追加案
- ユーザーごとの履歴やフィードバック保存
- 簡素化の品質フィードバック機能
- 複数の翻訳候補の提示

## スクリーンショット
（TODO: アプリのスクリーンショットを追加）

## 技術スタック
- **バックエンド**: Flask (Python)
- **フロントエンド**: HTML, CSS, JavaScript
- **AI**: Google Gemini API (gemini-1.5-flash)
- **環境変数管理**: python-dotenv

## 貢献
プルリクエストを歓迎します！

## ライセンス
MIT
