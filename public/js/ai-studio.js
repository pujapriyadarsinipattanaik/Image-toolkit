/**
 * VISION AI - AI STUDIO GENERATOR MODULE
 */

class AiStudio {
  constructor() {
    this.selectedStyle = 'none';
    this.selectedWidth = 1024;
    this.selectedHeight = 1024;
    this.currentGeneratedImage = null;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.promptInput = document.getElementById('aiPromptInput');
    this.enhanceBtn = document.getElementById('enhancePromptBtn');
    this.generateBtn = document.getElementById('generateAiBtn');

    this.styleChips = document.querySelectorAll('.style-chip');
    this.aspectBtns = document.querySelectorAll('.aspect-btn');

    this.placeholder = document.getElementById('aiPlaceholder');
    this.loader = document.getElementById('aiLoader');
    this.loaderText = document.getElementById('aiLoaderText');
    this.resultContainer = document.getElementById('aiResultContainer');
    this.resultImage = document.getElementById('aiResultImage');

    this.sendToEditorBtn = document.getElementById('sendToEditorBtn');
    this.downloadAiResultBtn = document.getElementById('downloadAiResultBtn');
  }

  bindEvents() {
    // Style Preset Chips
    this.styleChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const target = e.currentTarget;
        this.styleChips.forEach(c => c.classList.remove('active'));
        target.classList.add('active');
        this.selectedStyle = target.getAttribute('data-style');
      });
    });

    // Aspect Ratio Buttons
    this.aspectBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        this.aspectBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        this.selectedWidth = parseInt(target.getAttribute('data-width'));
        this.selectedHeight = parseInt(target.getAttribute('data-height'));
      });
    });

    // Enhance Prompt
    this.enhanceBtn.addEventListener('click', async () => {
      const prompt = this.promptInput.value.trim();
      if (!prompt) {
        window.showToast('Please type a prompt first to enhance', 'info');
        return;
      }

      try {
        const originalText = this.enhanceBtn.innerHTML;
        this.enhanceBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enhancing...';
        
        const res = await ApiService.enhancePrompt(prompt);
        if (res.success && res.enhanced) {
          this.promptInput.value = res.enhanced;
          window.showToast('Prompt enhanced with artistic descriptors!', 'success');
        }
        this.enhanceBtn.innerHTML = originalText;
      } catch (err) {
        window.showToast('Failed to enhance prompt', 'error');
      }
    });

    // Generate AI Image Button
    this.generateBtn.addEventListener('click', () => this.generate());

    // Send Image to Canvas Studio Editor
    this.sendToEditorBtn.addEventListener('click', () => {
      if (this.currentGeneratedImage && window.Editor) {
        window.Editor.loadImageFromUrl(this.currentGeneratedImage.url);
        if (window.App) window.App.switchTab('editor');
        window.showToast('Image loaded into Canvas Studio!', 'success');
      }
    });

    // Download AI Result Button
    this.downloadAiResultBtn.addEventListener('click', () => {
      if (this.currentGeneratedImage) {
        const a = document.createElement('a');
        a.href = this.currentGeneratedImage.url;
        a.download = `VisionAI-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  async generate() {
    const prompt = this.promptInput.value.trim();
    if (!prompt) {
      window.showToast('Please enter an image prompt description', 'error');
      return;
    }

    if (!window.Auth || !window.Auth.isAuthenticated()) {
      window.showToast('Please sign in to generate AI images', 'info');
      if (window.Auth) window.Auth.showModal();
      return;
    }

    // Show loading state
    this.showState('loader');
    this.generateBtn.disabled = true;

    try {
      const res = await ApiService.generateAiImage({
        prompt,
        style: this.selectedStyle,
        width: this.selectedWidth,
        height: this.selectedHeight
      });

      if (res.success && res.image) {
        this.currentGeneratedImage = res.image;
        this.resultImage.src = res.image.url;
        this.showState('result');
        window.showToast('AI Image generated successfully!', 'success');
        if (window.App) window.App.refreshDashboardStats();
      } else {
        throw new Error(res.message || 'Generation failed');
      }
    } catch (err) {
      window.showToast(err.message || 'AI Generation error. Please try again.', 'error');
      this.showState('placeholder');
    } finally {
      this.generateBtn.disabled = false;
    }
  }

  showState(state) {
    this.placeholder.classList.add('hidden');
    this.loader.classList.add('hidden');
    this.resultContainer.classList.add('hidden');

    if (state === 'placeholder') this.placeholder.classList.remove('hidden');
    if (state === 'loader') this.loader.classList.remove('hidden');
    if (state === 'result') this.resultContainer.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.AiStudio = new AiStudio();
});
