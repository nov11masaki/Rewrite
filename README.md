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

http://127.0.0.1:5001/

## Renderへのデプロイ

### デプロイ前の準備

1. **このリポジトリをGitHubにプッシュ** （既に完了）

2. **Renderの準備**
   - [Render.com](https://render.com) にアカウント作成
   - GitHubアカウントと連携

3. **新しいWebサービスを作成**
   - ダッシュボード → "New +" → "Web Service"
   - GitHubリポジトリを接続：`nov11masaki/Rewrite`
   - 以下の設定を入力：

   | 設定項目 | 値 |
   |---------|-----|
   | Name | rewrite-app (任意) |
   | Environment | Python 3 |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `gunicorn app:app` |

4. **環境変数を設定**
   - Environment Variables に以下を追加：
     ```
     OPENAI_API_KEY = your_openai_api_key
     FLASK_ENV = production
     ```
   - [OpenAI Platform](https://platform.openai.com/api-keys) でキーを取得

5. **デプロイ開始**
   - "Create Web Service" をクリック
   - ビルドとデプロイが自動で開始
   - 数分後、提供されたURLでアクセス可能

### デプロイ後

- 自動更新：GitHubの `main` ブランチにプッシュすると自動的に再デプロイされます
- ログ確認：Renderダッシュボードの "Logs" タブで確認可能


## 構成
- `app.py`: Flaskバックエンド（OpenAI API統合、GPT-4o mini使用）
- `templates/index.html`: シングルページUI（段階的に進行）
- `static/style.css`, `static/main.js`: フロントエンドのスタイルと動作
- `Procfile`: Render/Heroku用の起動設定
- `render.yaml`: Render用の詳細設定
- `requirements.txt`: Python依存関係

## 機能
- ✅ 同一ページで段階的に進むUI制御
- ✅ **AIが複数の書き換え候補を生成** → 学習者が最適なものを選択
- ✅ **Temperatureスライダー** で創造性レベルを調整
- ✅ **慣用句・ことわざを平易な日本語に自動変換**
- ✅ 複数文の入力に対応
- ✅ 学習者が英訳を作成 → AIが英訳を評価
- ✅ AIによるスコア評価と詳細フィードバック
- ✅ OpenAI GPT-4o miniによる高品質な評価
- ✅ APIキーがない場合のフォールバック機能
- ✅ Render/Herokuでのデプロイに対応

## 技術スタック
- **バックエンド**: Flask (Python)
- **フロントエンド**: HTML, CSS, JavaScript
- **AI**: OpenAI API (GPT-4o mini)
- **環境変数管理**: python-dotenv
- **プロダクション**: Gunicorn
- **デプロイ**: Render.com

## 貢献
プルリクエストを歓迎します！

## ライセンス
MIT
