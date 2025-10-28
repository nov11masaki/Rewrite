# 和文英訳 支援アプリ

学習者向けの和文英訳支援アプリです。日本語の文をまず学習者自身が「翻訳しやすい日本語」に書き換え、その判断もAIが行います。学習者は書き換えられた日本語を見て自分で英訳を試み、AIが英訳を評価します。

**例**: 「石の上にも三年」→ 学習者が翻訳しやすい日本語に変換 → AIが評価 → 学習者が英訳 → AIが評価

段階的に進めるUIで、同一ページ内で以下のフローを実現：
1. 日本語入力
2. **学習者が翻訳しやすい日本語に書き換え → AIが評価**
3. 評価結果の確認（OK or やり直し）
4. 学習者が英訳にチャレンジ → **AIが英訳を評価**
5. 最終確認

**OpenAI API (GPT-4o mini)** を使って高品質な評価と翻訳補助を提供します。

## セットアップ

### 前提条件
- Python 3.8以上
- OpenAI APIキー（[OpenAI Platform](https://platform.openai.com/api-keys)で取得）

1. 仮想環境を作成・有効化

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. 依存関係をインストール

```bash
pip install -r requirements.txt
```

3. OpenAI APIキーを設定（必須）

[OpenAI Platform](https://platform.openai.com/api-keys) でAPIキーを取得してください。

`.env` ファイルにAPIキーを記入：

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

**重要**: APIキーがない場合は簡易的なルールベース処理で動作しますが、評価が不正確になります。

4. アプリを起動

```bash
python3 app.py
```

5. ブラウザで開く

http://127.0.0.1:5000/

## 構成
- `app.py`: Flaskバックエンド（OpenAI API統合、GPT-4o mini使用）
- `templates/index.html`: シングルページUI（段階的に進行）
- `static/style.css`, `static/main.js`: フロントエンドのスタイルと動作

## 機能
- ✅ 同一ページで段階的に進むUI制御
- ✅ **学習者が翻訳しやすい日本語に書き換え → AIが評価**
- ✅ **学習者が英訳を作成 → AIが英訳を評価**
- ✅ AIによるスコア評価と詳細フィードバック
- ✅ 簡素化→確認→英訳→評価の順で進む
- ✅ OpenAI GPT-4o miniによる高品質な評価
- ✅ APIキーがない場合のフォールバック機能

## 技術スタック
- **バックエンド**: Flask (Python)
- **フロントエンド**: HTML, CSS, JavaScript
- **AI**: OpenAI API (GPT-4o mini)
- **環境変数管理**: python-dotenv

## 貢献
プルリクエストを歓迎します！

## ライセンス
MIT
