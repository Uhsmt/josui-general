# Josui General - 浄水システムアニメーション

下水処理プロセスを説明するSVGアニメーション集です。

## デモ

`index.html` をブラウザで開くとランチャーページが表示されます。

## 構成

```
animations/
├── 01_shochin/    # 初沈池アニメーション
├── 02_bio/        # 生物処理アニメーション
├── 03_final/      # 最終処理アニメーション
└── shared/        # 共通モジュール
    ├── gravel.js            # 砂利パーティクルシステム
    ├── caption-controller.js # キャプション制御
    └── common.css           # 共通スタイル
```

## カスタマイズ

### キャプションの編集

各 `index.html` 内の `captions` 配列を編集:

```javascript
const captions = [
  { time: 0, text: '表示するテキスト' },
  { time: 5, text: '5秒後に表示' },
];
```

### 色・スタイルの変更

`shared/common.css` または各ディレクトリの `style.css` を編集してください。

## 開発

```bash
npm install          # 依存パッケージをインストール
npm run lint         # 静的解析
npm run lint:fix     # 静的解析 + 自動修正
npm run format       # コード整形
```

## ブラウザ対応

Chrome, Firefox, Safari の最新版で動作確認済み。
