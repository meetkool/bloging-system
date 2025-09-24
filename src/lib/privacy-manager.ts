import { 
  PrivacyManager as IPrivacyManager, 
  PrivacyLevel, 
  PrivacyOption 
} from '@/types/blog-editor';

export const PRIVACY_OPTIONS: PrivacyOption[] = [
  { 
    value: 'public', 
    label: 'Public', 
    icon: 'public' 
  },
  { 
    value: 'friends', 
    label: 'Friends', 
    icon: 'friends' 
  },
  { 
    value: 'private', 
    label: 'Only me', 
    icon: 'private' 
  }
];

export class PrivacyManager implements IPrivacyManager {
  public currentPrivacy: PrivacyLevel = 'public';
  public options: PrivacyOption[] = PRIVACY_OPTIONS;
  public onPrivacyChange: (level: PrivacyLevel) => void = () => {};
  
  private dropdownElement: HTMLElement | null = null;
  private isDropdownOpen: boolean = false;

  constructor(initialPrivacy: PrivacyLevel = 'public') {
    this.currentPrivacy = initialPrivacy;
  }

  setPrivacy(level: PrivacyLevel): void {
    if (this.currentPrivacy !== level) {
      this.currentPrivacy = level;
      this.onPrivacyChange(level);
      this.updateDropdownDisplay();
    }
  }

  getPrivacy(): PrivacyLevel {
    return this.currentPrivacy;
  }

  renderDropdown(): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'blog-editor__privacy';
    
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'blog-editor__privacy-trigger';
    
    const currentOption = this.getCurrentOption();
    trigger.innerHTML = this.renderTriggerContent(currentOption);
    
    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'blog-editor__privacy-dropdown';
    menu.style.display = 'none';
    
    // Add options to menu
    this.options.forEach(option => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `privacy-option ${option.value === this.currentPrivacy ? 'active' : ''}`;
      item.innerHTML = this.renderOptionContent(option);
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setPrivacy(option.value);
        this.closeDropdown();
      });
      
      menu.appendChild(item);
    });
    
    // Add event listeners
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });
    
    dropdown.appendChild(trigger);
    dropdown.appendChild(menu);
    
    this.dropdownElement = dropdown;
    return dropdown;
  }

  private getCurrentOption(): PrivacyOption {
    return this.options.find(option => option.value === this.currentPrivacy) || this.options[0];
  }

  private renderTriggerContent(option: PrivacyOption): string {
    return `
      <div class="privacy-trigger-content">
        ${this.renderIcon(option.icon)}
        <span class="privacy-label">${option.label}</span>
        <svg class="privacy-arrow" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
    `;
  }

  private renderOptionContent(option: PrivacyOption): string {
    return `
      <div class="privacy-option-content">
        ${this.renderIcon(option.icon)}
        <div class="privacy-option-text">
          <div class="privacy-option-label">${option.label}</div>
          <div class="privacy-option-description">${this.getPrivacyDescription(option.value)}</div>
        </div>
        ${option.value === this.currentPrivacy ? this.renderCheckIcon() : ''}
      </div>
    `;
  }

  private renderIcon(iconName: string): string {
    const icons = {
      public: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
        </svg>
      `,
      friends: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25Z"/>
        </svg>
      `,
      private: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
        </svg>
      `
    };
    
    return `<div class="privacy-icon">${icons[iconName as keyof typeof icons] || icons.public}</div>`;
  }

  private renderCheckIcon(): string {
    return `
      <div class="privacy-check">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
        </svg>
      </div>
    `;
  }

  private getPrivacyDescription(level: PrivacyLevel): string {
    const descriptions = {
      public: 'Anyone can see this post',
      friends: 'Only your friends can see this',
      private: 'Only you can see this post'
    };
    
    return descriptions[level];
  }

  private toggleDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    if (!this.dropdownElement) return;
    
    const menu = this.dropdownElement.querySelector('.blog-editor__privacy-dropdown') as HTMLElement;
    if (menu) {
      menu.style.display = 'block';
      this.isDropdownOpen = true;
      
      // Position the dropdown
      this.positionDropdown();
      
      // Add active class to trigger
      const trigger = this.dropdownElement.querySelector('.blog-editor__privacy-trigger');
      trigger?.classList.add('active');
    }
  }

  private closeDropdown(): void {
    if (!this.dropdownElement) return;
    
    const menu = this.dropdownElement.querySelector('.blog-editor__privacy-dropdown') as HTMLElement;
    if (menu) {
      menu.style.display = 'none';
      this.isDropdownOpen = false;
      
      // Remove active class from trigger
      const trigger = this.dropdownElement.querySelector('.blog-editor__privacy-trigger');
      trigger?.classList.remove('active');
    }
  }

  private positionDropdown(): void {
    if (!this.dropdownElement) return;
    
    const menu = this.dropdownElement.querySelector('.blog-editor__privacy-dropdown') as HTMLElement;
    const trigger = this.dropdownElement.querySelector('.blog-editor__privacy-trigger') as HTMLElement;
    
    if (menu && trigger) {
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Reset position
      menu.style.top = '';
      menu.style.bottom = '';
      
      // Check if there's enough space below
      if (triggerRect.bottom + menuRect.height + 10 <= windowHeight) {
        // Position below trigger
        menu.style.top = '100%';
      } else {
        // Position above trigger
        menu.style.bottom = '100%';
      }
    }
  }

  private updateDropdownDisplay(): void {
    if (!this.dropdownElement) return;
    
    const trigger = this.dropdownElement.querySelector('.blog-editor__privacy-trigger');
    const currentOption = this.getCurrentOption();
    
    if (trigger) {
      trigger.innerHTML = this.renderTriggerContent(currentOption);
    }
    
    // Update active states in menu
    const options = this.dropdownElement.querySelectorAll('.privacy-option');
    options.forEach((option, index) => {
      if (this.options[index].value === this.currentPrivacy) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
      
      // Update option content to show/hide check mark
      option.innerHTML = this.renderOptionContent(this.options[index]);
    });
  }

  // Utility methods
  
  public destroy(): void {
    if (this.dropdownElement) {
      this.dropdownElement.remove();
      this.dropdownElement = null;
    }
    this.isDropdownOpen = false;
  }

  public isOpen(): boolean {
    return this.isDropdownOpen;
  }

  public getElement(): HTMLElement | null {
    return this.dropdownElement;
  }

  // Static utility methods
  
  public static getPrivacyLevel(value: string): PrivacyLevel {
    if (['public', 'friends', 'private'].includes(value)) {
      return value as PrivacyLevel;
    }
    return 'public'; // default fallback
  }

  public static getPrivacyIcon(level: PrivacyLevel): string {
    const option = PRIVACY_OPTIONS.find(opt => opt.value === level);
    return option?.icon || 'public';
  }

  public static getPrivacyLabel(level: PrivacyLevel): string {
    const option = PRIVACY_OPTIONS.find(opt => opt.value === level);
    return option?.label || 'Public';
  }
}

// Factory function
export function createPrivacyManager(initialPrivacy: PrivacyLevel = 'public'): PrivacyManager {
  return new PrivacyManager(initialPrivacy);
}
