/** Помощники аватара: инициалы, клиентская валидация и кроп перед отправкой
 *  на сервер (`POST /api/auth/avatar`). Сам аватар хранится на сервере. */
const AVATAR_SIZE = 160
const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Инициалы для fallback-аватара: первые буквы двух слов. */
export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'K'
  )
}

/** Проверяет тип и размер файла до отправки; возвращает текст ошибки или `null`. */
export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Аватар — изображение JPEG, PNG или WebP.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Файл больше 2 МБ — выберите изображение поменьше.'
  }

  return null
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Не удалось открыть изображение.'))
    image.src = src
  })
}

/** Квадратный кроп 160×160 и сжатие в JPEG — файл для multipart-загрузки. */
export async function fileToAvatarFile(file: File): Promise<File> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')

  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')

  if (!context) return file

  const scale = Math.max(AVATAR_SIZE / image.width, AVATAR_SIZE / image.height)
  const width = image.width * scale
  const height = image.height * scale

  context.drawImage(image, (AVATAR_SIZE - width) / 2, (AVATAR_SIZE - height) / 2, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))

  if (!blob) return file

  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
}
