import { 
  UploadManager as IUploadManager, 
  FileDropHandler as IFileDropHandler,
  ImageContent 
} from '@/types/blog-editor';

export class FileDropHandler implements IFileDropHandler {
  public element: HTMLElement;
  public callback: (file: File) => void;
  private dropTimer: number = 0;
  private isDragOver: boolean = false;

  constructor(element: HTMLElement, callback: (file: File) => void) {
    this.element = element;
    this.callback = callback;
  }

  init(): void {
    // Prevent default drag behaviors on window
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    this.element.addEventListener('dragenter', this.handleDragEnter);
    this.element.addEventListener('dragover', this.handleDragOver);
    this.element.addEventListener('dragleave', this.handleDragLeave);
    this.element.addEventListener('drop', this.handleDrop);
  }

  destroy(): void {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.removeEventListener(eventName, this.preventDefaults, false);
    });

    this.element.removeEventListener('dragenter', this.handleDragEnter);
    this.element.removeEventListener('dragover', this.handleDragOver);
    this.element.removeEventListener('dragleave', this.handleDragLeave);
    this.element.removeEventListener('drop', this.handleDrop);
  }

  showDropZone(): void {
    if (!this.isDragOver) {
      this.element.classList.add('drag-over');
      this.isDragOver = true;
      
      // Show drop overlay
      const overlay = this.createDropOverlay();
      this.element.appendChild(overlay);
    }
  }

  hideDropZone(): void {
    if (this.isDragOver) {
      this.element.classList.remove('drag-over');
      this.isDragOver = false;
      
      // Remove drop overlay
      const overlay = this.element.querySelector('.drop-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  }

  private preventDefaults = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  private handleDragEnter = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    
    const dt = e.dataTransfer;
    if (this.hasFiles(dt)) {
      this.showDropZone();
      clearTimeout(this.dropTimer);
    }
  };

  private handleDragOver = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    
    const dt = e.dataTransfer;
    if (this.hasFiles(dt)) {
      this.showDropZone();
      clearTimeout(this.dropTimer);
      
      // Set the dropEffect to copy
      if (dt) {
        dt.dropEffect = 'copy';
      }
    }
  };

  private handleDragLeave = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use a timer to avoid flickering when dragging over child elements
    this.dropTimer = window.setTimeout(() => {
      this.hideDropZone();
    }, 25);
  };

  private handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    
    this.hideDropZone();
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Process the first file
      this.callback(files[0]);
    }
  };

  private hasFiles(dt: DataTransfer | null): boolean {
    if (!dt) return false;
    
    return dt.types != null && 
           (dt.types.indexOf ? 
            dt.types.indexOf('Files') !== -1 : 
            dt.types.includes('application/x-moz-file'));
  }

  private createDropOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'drop-overlay';
    overlay.innerHTML = `
      <div class="drop-overlay__content">
        <div class="drop-overlay__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        <div class="drop-overlay__text">Drop files here to upload</div>
      </div>
    `;
    return overlay;
  }
}

export class UploadManager implements IUploadManager {
  public supportedTypes: string[] = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  public maxFileSize: number = 10 * 1024 * 1024; // 10MB
  public uploadEndpoint: string = '/api/upload';
  
  private fileDropHandler: FileDropHandler | null = null;
  private fileInputElement: HTMLInputElement | null = null;

  // Event callbacks
  public onUploadStart: () => void = () => {};
  public onUploadProgress: (progress: number) => void = () => {};
  public onUploadComplete: (result: ImageContent) => void = () => {};
  public onUploadError: (error: string) => void = () => {};

  constructor(config?: {
    supportedTypes?: string[];
    maxFileSize?: number;
    uploadEndpoint?: string;
  }) {
    if (config) {
      this.supportedTypes = config.supportedTypes || this.supportedTypes;
      this.maxFileSize = config.maxFileSize || this.maxFileSize;
      this.uploadEndpoint = config.uploadEndpoint || this.uploadEndpoint;
    }
  }

  init(): void {
    this.createFileInput();
  }

  destroy(): void {
    if (this.fileDropHandler) {
      this.fileDropHandler.destroy();
    }
    
    if (this.fileInputElement) {
      this.fileInputElement.remove();
    }
  }

  // Enable drag and drop on an element
  enableDragDrop(element: HTMLElement): void {
    this.fileDropHandler = new FileDropHandler(element, (file) => {
      // Create a FileList-like object with the single file
      const fileList = Object.create(FileList.prototype);
      Object.defineProperty(fileList, '0', { value: file });
      Object.defineProperty(fileList, 'length', { value: 1 });
      this.handleFileSelect(fileList);
    });
    this.fileDropHandler.init();
  }

  // Trigger file selection dialog
  selectFiles(): void {
    if (this.fileInputElement) {
      this.fileInputElement.click();
    }
  }

  handleFileSelect(files: FileList): void {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.onUploadError(validation.error || 'Invalid file');
      return;
    }
    
    // Start upload
    this.uploadFile(file);
  }

  handleDrop(): void {
    // This is handled by FileDropHandler
    console.log('Drop event handled by FileDropHandler');
  }

  handlePaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    
    // Look for image files in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const fileList = Object.create(FileList.prototype);
          Object.defineProperty(fileList, '0', { value: file });
          Object.defineProperty(fileList, 'length', { value: 1 });
          this.handleFileSelect(fileList);
        }
        break;
      }
    }
  }

  async uploadFile(file: File): Promise<ImageContent> {
    this.onUploadStart();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          this.onUploadProgress(progress);
        }
      });
      
      // Create promise to handle the upload
      const uploadPromise = new Promise<ImageContent>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              
              if (response.error) {
                reject(new Error(response.message || 'Upload failed'));
              } else {
                const imageContent: ImageContent = {
                  path: response.path || response.url,
                  thumb: response.thumb || response.thumbnail || response.path || response.url,
                  name: response.name || file.name,
                  type: response.type || file.type
                };
                
                this.onUploadComplete(imageContent);
                resolve(imageContent);
              }
        } catch {
          reject(new Error('Failed to parse upload response'));
        }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        
        xhr.ontimeout = () => {
          reject(new Error('Upload timeout'));
        };
      });
      
      // Set timeout (30 seconds)
      xhr.timeout = 30000;
      
      // Start the upload
      xhr.open('POST', this.uploadEndpoint);
      xhr.send(formData);
      
      return await uploadPromise;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      this.onUploadError(errorMessage);
      throw err;
    }
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.supportedTypes.includes(file.type)) {
      const supportedExtensions = this.supportedTypes.map(type => 
        type.split('/')[1].toUpperCase()
      ).join(', ');
      return {
        valid: false,
        error: `"${file.name}" is not a supported file type. Please use: ${supportedExtensions} files.`
      };
    }
    
    // Check file size
    if (file.size > this.maxFileSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = Math.floor(this.maxFileSize / (1024 * 1024));
      return {
        valid: false,
        error: `File "${file.name}" is ${fileSizeMB}MB, which exceeds the ${maxSizeMB}MB limit. Try compressing the image or using a smaller file.`
      };
    }
    
    return { valid: true };
  }

  private createFileInput(): void {
    this.fileInputElement = document.createElement('input');
    this.fileInputElement.type = 'file';
    this.fileInputElement.multiple = false;
    this.fileInputElement.accept = this.supportedTypes.join(',');
    this.fileInputElement.style.display = 'none';
    
    this.fileInputElement.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.handleFileSelect(target.files);
      }
    });
    
    document.body.appendChild(this.fileInputElement);
  }

  // Utility method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Method to check if a file type is supported
  isFileTypeSupported(file: File): boolean {
    return this.supportedTypes.includes(file.type);
  }

  // Method to get supported file types as a human-readable string
  getSupportedTypesString(): string {
    return this.supportedTypes
      .map(type => type.split('/')[1].toUpperCase())
      .join(', ');
  }
}

// Factory function to create upload manager
export function createUploadManager(config?: {
  supportedTypes?: string[];
  maxFileSize?: number;
  uploadEndpoint?: string;
}): UploadManager {
  return new UploadManager(config);
}
