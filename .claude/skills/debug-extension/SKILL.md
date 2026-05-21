---
name: debug-extension
description: Debug this WXT browser extension on a live Zenn page using chrome-devtools-mcp. Use when the user reports the extension's UI not appearing, wants to verify content-script behavior on zenn.dev, or asks to debug/inspect the loaded extension in a real browser.
---

# Debug Extension (chrome-devtools-mcp)

このプロジェクトの拡張機能 (content script のみ。background/service worker なし) を、実際の Zenn ページ上で chrome-devtools-mcp を使って検証する手順。

## 大原則: 実 Chrome に接続する (`--browserUrl`)

chrome-devtools-mcp はデフォルトで**専用の Chrome for Testing を新規起動する**が、そこには拡張機能が入っていない。さらに `--load-extension` 注入は Chrome 128+/144 のロックで不安定なので**使わない**。代わりに、ユーザーが手動ロードした実 Chrome に remote-debugging で接続する。

## 既知の落とし穴 (これで何度もハマった)

- **Chrome 136+**: デフォルトプロファイルでは `--remote-debugging-port` が無効化される → 必ず**専用 `--user-data-dir`** を使う。
- **Chrome 128+/144**: コマンドラインの `--load-extension` がデフォルト無効 (`DisableLoadExtensionCommandLineSwitch`)。フラグ回避も不安定なので、**`chrome://extensions` から手動ロード**するのが確実。
- **MCP は `chrome://*` 内部ページを列挙・選択しない** → `list_pages` が空でも接続は生きている。実 web ページ (Zenn) を開けば操作できる。
- **content script は拡張ロード後に開かれたタブにしか注入されない** → ロード後に必ずページをリロード。
- この拡張は content-script のみなので、`/json` のターゲット一覧に service worker は出ない。ロード確認は Zenn ページで `zenn-locale-toggle` 要素の有無で行う。

## 手順

### 1. ビルドを最新化
```
bun run build   # 出力: .output/chrome-mv3/
```

### 2. `.mcp.json` を接続方式にする (プロジェクト直下)
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

### 3. ユーザーに専用プロファイルで Chrome を起動してもらう
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.config/google-chrome-zenn-debug"
```
起動後、その Chrome の `chrome://extensions` で:
Developer mode ON → 「パッケージ化されていない拡張機能を読み込む」→ `<project>/.output/chrome-mv3` を選択。
(専用プロファイルなので一度入れれば次回以降も残る)

### 4. Claude Code を再起動
`.mcp.json` 変更後は再起動しないと `chrome-devtools-ext` ツールが新設定で接続しない。

### 5. 接続確認とデバッグ
- `curl -s http://127.0.0.1:9222/json/version` で endpoint 生存確認
- MCP `new_page` で Zenn 記事を開く (例: `https://zenn.dev/sigma_tom/articles/haskell-functional-programming-intro`)
- `navigate_page` type=reload で content script を確実に注入
- `evaluate_script` で検証:
  ```js
  () => {
    const host = document.querySelector('zenn-locale-toggle');
    const sr = host?.shadowRoot;
    return {
      hostFound: !!host,
      btns: sr ? [...sr.querySelectorAll('button')].map(b => b.textContent.trim()) : null,
      active: sr ? [...sr.querySelectorAll('button')].map(b => ({label:b.textContent.trim(), active:b.getAttribute('data-active')})) : null,
      search: location.search,
    };
  }
  ```
- `take_screenshot` で右下トグルを目視
- `list_console_messages` でエラー確認
- トグル動作確認: EN ボタンを click → URL に `?locale=en` が付けば OK

## 期待される正常動作
- `zenn-locale-toggle` が body に注入される
- 右下に JA/EN トグル表示
- `?locale` 無し → JA が active、EN クリックで `?locale=en` に遷移

## デバッグ完了後
`.mcp.json` を残すかは要確認。今後もこの方式で debug するなら残す、不要ならコミット前に削除。
