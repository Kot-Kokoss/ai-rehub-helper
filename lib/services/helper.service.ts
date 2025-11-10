import { AllowedMimeTypes, AllowedFileExtensions } from '../consts';

class HelperService {
  checkFileType(file: File): boolean {
    if (!file) return false;

    // Проверка MIME-типа
    const isValidMimeType = AllowedMimeTypes.video.includes(file.type);

    // Проверка расширения файла
    const fileExtension = this.getFileExtension(file.name);
    const isValidExtension = AllowedFileExtensions.video.includes(fileExtension);

    return isValidMimeType && isValidExtension;
  }

  checkFileSize(file: File, maxSizeInBytes: number): boolean {
    if (!file) return false;
    return file.size <= maxSizeInBytes;
  }

  checkVideoFile(
    file: File,
    maxSizeInBytes: number = 2 * 1024 * 1024 * 1024,
  ): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'Файл не выбран' };
    }

    if (!this.checkFileType(file)) {
      return {
        isValid: false,
        error: `Недопустимый тип файла. Разрешены: ${AllowedFileExtensions.video.join(', ')}`,
      };
    }

    if (!this.checkFileSize(file, maxSizeInBytes)) {
      const fileSizeInGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
      const maxSizeInGB = (maxSizeInBytes / (1024 * 1024 * 1024)).toFixed(0);
      return {
        isValid: false,
        error: `Файл слишком большой: ${fileSizeInGB} ГБ. Максимальный размер: ${maxSizeInGB} ГБ`,
      };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'Файл пустой' };
    }

    return { isValid: true };
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }
}

export const helperService = new HelperService();
