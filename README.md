# zenn_ja_en_switcher

## INDEX

- [ABOUT](#about)
- [ENVIRONMENT](#environment)
- [HOW TO USE](#how-to-use)
- [For Developer](#for-developer)

## ABOUT

Zenn の記事ページに `🇯🇵 JA` / `🇬🇧 EN` のフロート式トグルボタンを差し込み、ワンクリックで `?locale=en` の付け外しをするブラウザ拡張機能。

Zennは翻訳機能をオンにしている場合、英語記事が自動生成される。
だが、記事の執筆者が翻訳されたページを確認するためには、URLに`?locale=en`を付ける必要がある。
本拡張機能は、UI 上に切り替えスイッチを提供し、記事投稿者の翻訳確認などを楽にする。

---

## ENVIRONMENT

| | |
| --- | --- |
| 拡張フレームワーク | [WXT](https://wxt.dev/) (Manifest V3, Chrome/Firefox 両対応) |
| UI | React 19 + TypeScript |
| 注入方式 | Content Script + Shadow Root UI (Zenn 側 CSS と非干渉) |
| パッケージ管理 | bun |
| 開発環境 | nix-flake (`bun`, `nodejs_22`) |

---

## HOW TO USE

### 前提

<https://zenn.dev/settings/account> により、該当ユーザが**記事の英語版の生成を有効にする**をオンにしていること

### build from source and install

#### Chrome / Edge

1. `bun run build` を実行
2. `chrome://extensions` を開き、右上の「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`.output/chrome-mv3/` ディレクトリを選択

#### Firefox

1. `bun run build:firefox` を実行
2. `about:debugging#/runtime/this-firefox` を開く
3. 「一時的なアドオンを読み込む」から `.output/firefox-mv2/manifest.json` を選択
   (一時インストールのため、Firefox を再起動すると消える)

> [!WARNING]
> `about:addons` の「ファイルからアドオンをインストール」からは読み込めない。
> こちらは `.xpi` / `.zip` パッケージを要求するため、`manifest.json` 単体を指定するとロード失敗になる。

---

## For Developer

### install dependencis

```sh
nix develop
bun install
```

### try to run

開発モードでは WXT がブラウザを自動起動し、拡張機能を読み込んだ状態で立ち上げる。
コードを保存すると HMR で content script がリロードされる。

```shell
# 自分の環境では必要だった。
sudo sysctl fs.inotify.max_user_watches=524288 fs.inotify.max_user_instances=512
```

```sh
# Chrome 用 dev (HMR 付きで Chrome が起動)
bun run dev

# Firefox 用 dev
bun run dev:firefox
```

動作確認には Zenn の任意の記事ページを開く。例:

- <https://zenn.dev/sigma_tom/articles/haskell-functional-programming-intro>

> [!NOTE]
> Extensionsが表示されない場合にはリロードすると表示されることがある。

### build

```sh
# Chrome MV3 用に .output/chrome-mv3/ を生成
bun run build

# Firefox 用ビルド
bun run build:firefox

# ストア提出用の zip を生成
bun run zip
bun run zip:firefox
```

ビルド成果物は `.output/` 配下に出力される。

### debug with Claude Code using chrome-devtools-mcp

content script が実際の Zenn ページで動くかを、[chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) 経由で検証する手順。
(詳細な手順とスニペットは `.claude/skills/debug-extension/SKILL.md` にもまとめてある)

#### 方針

chrome-devtools-mcp はデフォルトで専用 Chrome を新規起動するが、そこには拡張機能が入っていない。
さらにコマンドラインの `--load-extension` は Chrome 128+/144 のロックで不安定なので使わない。
**ユーザーが手動ロードした実 Chrome に `--browserUrl` で remote-debugging 接続する**のが確実。

#### 既知の落とし穴

- **Chrome 136+**: デフォルトプロファイルでは `--remote-debugging-port` が無効化される → 専用 `--user-data-dir` を使う
- **Chrome 128+/144**: コマンドラインの `--load-extension` が既定で無効 → `chrome://extensions` から手動ロードが確実
- MCP は `chrome://*` 内部ページを列挙・選択しない (`list_pages` が空でも接続は生きている)
- content script は拡張ロード後に開いたタブにしか注入されない → ロード後にページをリロード
- 本拡張は content-script のみ (background/service worker なし) なので、ロード確認は Zenn ページ上の `zenn-locale-toggle` 要素の有無で行う

#### 手順

1. ビルドを最新化

   ```sh
   bun run build
   ```

2. プロジェクト直下に `.mcp.json` を作成 (接続方式)

   ```json
   {
     "mcpServers": {
       "chrome-devtools-ext": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "chrome-devtools-mcp@latest", "--browserUrl=http://127.0.0.1:9222"]
       }
     }
   }
   ```

3. 専用プロファイルで Chrome を起動(ユーザが実行)

   ```sh
   google-chrome \
     --remote-debugging-port=9222 \
     --user-data-dir="$HOME/.config/google-chrome-zenn-debug"
   ```

   起動した Chrome の `chrome://extensions` で、デベロッパーモード ON →
   「パッケージ化されていない拡張機能を読み込む」→ `.output/chrome-mv3/` を選択。
   (専用プロファイルなので一度入れれば次回以降も残る)

4. Claude Code を再起動して `chrome-devtools-ext` ツールを有効化

5. MCP で `new_page` → Zenn 記事を開き、`navigate_page` (reload) で content script を注入。
   `evaluate_script` で `zenn-locale-toggle` の有無やトグル状態を検証し、`take_screenshot` で目視。

> ビルドし直した後は `chrome://extensions` で拡張の再読み込み (↻) が必要。
