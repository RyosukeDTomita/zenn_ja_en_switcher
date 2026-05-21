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

- Nix Flake
  - bun
  - node.js

---

## HOW TO USE

TODO: ここにユーザ向け手順を書く。

---

```sh
# 1) flake で devShell に入る（bun / node がここで使えるようになる）
nix develop

# 2) 依存をインストール（postinstall で wxt prepare が走り .wxt/ と型定義が生成される）
bun install
```

## For Developer

```sh
# Chrome 用 dev (HMR 付きで Chrome が起動)
bun run dev

# Firefox 用 dev
bun run dev:firefox
```

開発モードでは WXT がブラウザを自動起動し、拡張機能を読み込んだ状態で立ち上げる。
コードを保存すると HMR で content script がリロードされる。

動作確認には Zenn の任意の記事ページを開く。例:

- <https://zenn.dev/sigma_tom/articles/9bd3d01d9f8531>

## ビルド

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

## 手動インストール (ストア未公開時)

### Chrome / Edge

1. `bun run build` を実行
2. `chrome://extensions` を開き、右上の「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`.output/chrome-mv3/` ディレクトリを選択

### Firefox

1. `bun run build:firefox` を実行
2. `about:debugging#/runtime/this-firefox` を開く
3. 「一時的なアドオンを読み込む」から `.output/firefox-mv2/manifest.json` を選択
   (一時インストールのため、Firefox を再起動すると消える)

## プロジェクト構成

```
.
├── flake.nix                    # devShell (bun + nodejs_22)
├── package.json                 # bun が管理
├── wxt.config.ts                # WXT 設定 + manifest
├── tsconfig.json                # .wxt が生成する tsconfig を extend
├── entrypoints/
│   └── content.tsx              # Zenn 記事ページに UI を注入する content script
└── components/
    ├── LocaleToggle.tsx         # JA/EN 切替の React コンポーネント
    └── LocaleToggle.module.css  # Shadow DOM に閉じ込めるスタイル
```

## 技術スタック

| | |
| --- | --- |
| 拡張フレームワーク | [WXT](https://wxt.dev/) (Manifest V3, Chrome/Firefox 両対応) |
| UI | React 19 + TypeScript |
| 注入方式 | Content Script + Shadow Root UI (Zenn 側 CSS と非干渉) |
| パッケージ管理 | bun |
| 開発環境 | nix-flake (`bun`, `nodejs_22`) |
