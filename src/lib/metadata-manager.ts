import { 
  MetadataManager as IMetadataManager,
  PostMetadata,
  MetadataField 
} from '@/types/blog-editor';

export class MetadataManager implements IMetadataManager {
  public fields: Map<keyof PostMetadata, MetadataField> = new Map();
  public onFieldChange: (name: keyof PostMetadata, value: string) => void = () => {};
  
  private metadata: PostMetadata = {
    feeling: '',
    persons: '',
    location: ''
  };

  constructor() {
    this.initializeFields();
  }

  private initializeFields(): void {
    const fieldConfigs: MetadataField[] = [
      {
        name: 'feeling',
        label: 'Feeling',
        placeholder: 'How are you feeling?',
        icon: 'mood',
        isActive: false
      },
      {
        name: 'persons',
        label: 'With',
        placeholder: 'Who are you with?',
        icon: 'people',
        isActive: false
      },
      {
        name: 'location',
        label: 'Location',
        placeholder: 'Where are you?',
        icon: 'location',
        isActive: false
      }
    ];

    fieldConfigs.forEach(field => {
      this.fields.set(field.name, field);
    });
  }

  setField(name: keyof PostMetadata, value: string): void {
    const oldValue = this.metadata[name];
    if (oldValue !== value) {
      this.metadata[name] = value;
      
      // Update field active state
      const field = this.fields.get(name);
      if (field) {
        field.isActive = value.trim() !== '';
        this.fields.set(name, field);
      }
      
      this.onFieldChange(name, value);
    }
  }

  getField(name: keyof PostMetadata): string {
    return this.metadata[name];
  }

  clearField(name: keyof PostMetadata): void {
    this.setField(name, '');
  }

  toggleField(name: keyof PostMetadata): void {
    const field = this.fields.get(name);
    if (field) {
      field.isActive = !field.isActive;
      this.fields.set(name, field);
      
      // If deactivating, clear the field value
      if (!field.isActive) {
        this.setField(name, '');
      }
    }
  }

  renderOptionsTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'blog-editor__metadata-table';

    this.fields.forEach((field) => {
      if (field.isActive) {
        const row = document.createElement('div');
        row.className = 'metadata-field-row';
        
        const label = document.createElement('div');
        label.className = 'metadata-field-label';
        label.innerHTML = `
          ${this.renderFieldIcon(field.icon)}
          <span>${field.label}</span>
        `;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'metadata-field-input';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = field.placeholder;
        input.value = this.metadata[field.name];
        input.className = 'metadata-input';
        
        // Add event listeners
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement;
          this.setField(field.name, target.value);
        });
        
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            this.toggleField(field.name);
            this.refreshDisplay();
          }
        });
        
        // Add clear button
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'metadata-clear-btn';
        clearButton.title = 'Clear field';
        clearButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        `;
        
        clearButton.addEventListener('click', () => {
          this.toggleField(field.name);
          this.refreshDisplay();
        });
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(clearButton);
        
        row.appendChild(label);
        row.appendChild(inputContainer);
        table.appendChild(row);
      }
    });

    return table;
  }

  renderToolbarIcons(): HTMLElement[] {
    const icons: HTMLElement[] = [];
    
    this.fields.forEach((field) => {
      if (!field.isActive) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'metadata-toolbar-btn';
        button.title = `Add ${field.label.toLowerCase()}`;
        button.innerHTML = this.renderFieldIcon(field.icon);
        
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleField(field.name);
          this.refreshDisplay();
        });
        
        icons.push(button);
      }
    });
    
    return icons;
  }

  private renderFieldIcon(iconName: string): string {
    const icons = {
      mood: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      `,
      people: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25Z"/>
        </svg>
      `,
      location: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
        </svg>
      `
    };
    
    return `<div class="metadata-icon">${icons[iconName as keyof typeof icons] || icons.mood}</div>`;
  }

  private refreshDisplay(): void {
    // This method would be called to refresh the UI
    // In a React context, this would trigger a re-render
    const event = new CustomEvent('metadataUpdate', {
      detail: { metadata: this.metadata, fields: Array.from(this.fields.values()) }
    });
    document.dispatchEvent(event);
  }

  // Utility methods for getting all metadata
  
  public getAllMetadata(): PostMetadata {
    return { ...this.metadata };
  }

  public setAllMetadata(metadata: Partial<PostMetadata>): void {
    Object.keys(metadata).forEach(key => {
      const fieldName = key as keyof PostMetadata;
      if (metadata[fieldName] !== undefined) {
        this.setField(fieldName, metadata[fieldName]!);
      }
    });
  }

  public clearAllFields(): void {
    this.fields.forEach((_, fieldName) => {
      this.clearField(fieldName);
    });
  }

  public getActiveFields(): MetadataField[] {
    return Array.from(this.fields.values()).filter(field => field.isActive);
  }

  public getInactiveFields(): MetadataField[] {
    return Array.from(this.fields.values()).filter(field => !field.isActive);
  }

  public hasActiveFields(): boolean {
    return this.getActiveFields().length > 0;
  }

  // Validation methods
  
  public validateFields(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Add any validation rules here
    // For now, all fields are optional, so validation always passes
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Export/Import methods
  
  public exportMetadata(): string {
    return JSON.stringify({
      metadata: this.metadata,
      activeFields: this.getActiveFields().map(f => f.name)
    });
  }

  public importMetadata(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.metadata) {
        this.setAllMetadata(data.metadata);
      }
      
      if (data.activeFields && Array.isArray(data.activeFields)) {
        // First deactivate all fields
        this.fields.forEach((field) => {
          field.isActive = false;
        });
        
        // Then activate specified fields
        data.activeFields.forEach((fieldName: keyof PostMetadata) => {
          const field = this.fields.get(fieldName);
          if (field) {
            field.isActive = true;
          }
        });
      }
      
    } catch (err) {
      console.error('Failed to import metadata:', err);
    }
  }

  // Location-specific helper methods
  
  public async getCurrentLocation(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          resolve(locationString);
        },
        (error) => {
          reject(new Error('Failed to get current location'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  public async setCurrentLocation(): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      this.setField('location', location);
      
      // Activate location field if not already active
      const locationField = this.fields.get('location');
      if (locationField && !locationField.isActive) {
        this.toggleField('location');
      }
    } catch (error) {
      console.error('Failed to set current location:', error);
    }
  }

  // Common feelings suggestions
  
  public static getCommonFeelings(): string[] {
    return [
      '😊 happy',
      '😍 excited',
      '😌 blessed',
      '😄 cheerful',
      '🥳 celebrating',
      '💪 motivated',
      '😎 confident',
      '🤗 grateful',
      '😋 satisfied',
      '😴 tired',
      '🤔 thoughtful',
      '😮 amazed',
      '🙄 annoyed',
      '😤 frustrated',
      '😢 sad',
      '😰 worried'
    ];
  }
}

// Factory function
export function createMetadataManager(): MetadataManager {
  return new MetadataManager();
}
