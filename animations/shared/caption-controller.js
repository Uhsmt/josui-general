// キャプションコントローラー - 説明文の自動切り替えとハイライト表示を制御
class CaptionController {
    constructor(captions, interval = 5000) {
        this.captions = captions;
        this.interval = interval;
        this.currentIndex = 0;
        this.captionElement = document.getElementById('captionText');
        this.highlightLayer = document.getElementById('highlightLayer');
        this.dotsContainer = null;
        this.dots = [];
        this.intervalId = null;
        this.isPaused = false;

        if (!this.captionElement) {
            console.error('キャプション要素が見つかりません');
            return;
        }

        // ドットインジケーターを作成（複数キャプションがある場合のみ）
        if (this.captions.length > 1) {
            this.createDots();
            this.startAutoSwitch();
            this.setupPauseControls();
        } else {
            // 1つだけの場合は初期表示のみ
            this.showCaption(0);
        }
    }

    setupPauseControls() {
        // クリックで一時停止/再開
        document.addEventListener('click', (e) => {
            // 戻るボタンなどのリンクは除外
            if (e.target.closest('a')) return;
            this.togglePause();
        });

        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.goToPrevious();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.goToNext();
            }
        });
    }

    goToPrevious() {
        // 前のキャプションへ（ループ）
        this.currentIndex = (this.currentIndex - 1 + this.captions.length) % this.captions.length;
        this.switchCaption();
        this.resetInterval();
    }

    goToNext() {
        // 次のキャプションへ（ループ）
        this.currentIndex = (this.currentIndex + 1) % this.captions.length;
        this.switchCaption();
        this.resetInterval();
    }

    resetInterval() {
        // 自動再生中ならタイマーをリセット（次の切り替えまでの時間をリセット）
        if (!this.isPaused && this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => {
                this.nextCaption();
            }, this.interval);
        }
    }

    switchCaption() {
        // フェードアウト
        this.captionElement.classList.remove('fade-in', 'fade-in-start');
        this.captionElement.classList.add('fade-out');

        setTimeout(() => {
            this.showCaption(this.currentIndex);
            this.captionElement.classList.remove('fade-out');

            requestAnimationFrame(() => {
                this.captionElement.classList.add('fade-in-start');
                requestAnimationFrame(() => {
                    this.captionElement.classList.remove('fade-in-start');
                    this.captionElement.classList.add('fade-in');
                });
            });
        }, 300);
    }

    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    pause() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isPaused = true;
        if (this.dotsContainer) {
            this.dotsContainer.classList.add('paused');
        }
        if (this.pauseIndicator) {
            this.pauseIndicator.classList.add('visible');
        }
    }

    resume() {
        this.isPaused = false;
        if (this.dotsContainer) {
            this.dotsContainer.classList.remove('paused');
        }
        if (this.pauseIndicator) {
            this.pauseIndicator.classList.remove('visible');
        }
        this.intervalId = setInterval(() => {
            this.nextCaption();
        }, this.interval);
    }

    createDots() {
        // ドットコンテナを作成
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'caption-dots';

        // 各キャプション用のドットを作成
        this.captions.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'caption-dot';
            if (index === 0) {
                dot.classList.add('active');
            }
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });

        // キャプション要素の後に挿入
        this.captionElement.parentNode.insertBefore(
            this.dotsContainer,
            this.captionElement.nextSibling
        );

        // 一時停止インジケーターを作成
        this.pauseIndicator = document.createElement('div');
        this.pauseIndicator.className = 'pause-indicator';
        this.pauseIndicator.innerHTML = '<span></span><span></span>';
        document.body.appendChild(this.pauseIndicator);
    }

    updateDots(index) {
        this.dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    startAutoSwitch() {
        // 最初のキャプションを表示（初期状態）
        this.showCaption(0);
        this.captionElement.classList.add('fade-in');

        // 定期的にキャプションを切り替え
        this.intervalId = setInterval(() => {
            this.nextCaption();
        }, this.interval);
    }

    nextCaption() {
        // すべてのクラスをクリア
        this.captionElement.classList.remove('fade-in', 'fade-in-start');

        // 次のフレームでフェードアウト開始
        requestAnimationFrame(() => {
            this.captionElement.classList.add('fade-out');
        });

        // フェードアウトの完了を待つ（500ms）
        setTimeout(() => {
            // 次のキャプションに移動
            this.currentIndex = (this.currentIndex + 1) % this.captions.length;
            this.showCaption(this.currentIndex);

            // fade-outを削除
            this.captionElement.classList.remove('fade-out');

            // フレームを1つ待機してからfade-in-startを設定
            requestAnimationFrame(() => {
                this.captionElement.classList.add('fade-in-start');

                // さらに次のフレームでfade-inに変更してアニメーション開始
                requestAnimationFrame(() => {
                    this.captionElement.classList.remove('fade-in-start');
                    this.captionElement.classList.add('fade-in');
                });
            });
        }, 500);
    }

    showCaption(index) {
        const caption = this.captions[index];

        // テキストを更新
        this.captionElement.innerHTML = caption.text;

        // ドットを更新
        if (this.dots.length > 0) {
            this.updateDots(index);
        }

        // ハイライトを更新
        this.updateHighlight(caption.highlight);
    }

    updateHighlight(highlightData) {
        // 既存のハイライトをクリア
        if (this.highlightLayer) {
            this.highlightLayer.innerHTML = '';
        }

        // ハイライトデータがない場合は終了
        if (!highlightData || !this.highlightLayer) {
            return;
        }

        // 単一のハイライトエリアの場合
        if (!Array.isArray(highlightData)) {
            highlightData = [highlightData];
        }

        // ハイライトエリアを作成
        highlightData.forEach(area => {
            const highlightDiv = document.createElement('div');
            highlightDiv.className = 'highlight-area';
            highlightDiv.style.top = area.top;
            highlightDiv.style.left = area.left;
            highlightDiv.style.width = area.width;
            highlightDiv.style.height = area.height;

            this.highlightLayer.appendChild(highlightDiv);
        });
    }
}

// グローバルに公開
window.CaptionController = CaptionController;
