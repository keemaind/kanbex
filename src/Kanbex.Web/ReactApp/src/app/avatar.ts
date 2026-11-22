import { useEffect, useState } from 'react'

/** Аватар хранится на клиенте (localStorage, dataURL 160×160) —
 *  серверное хранение появится вместе с эндпоинтом профиля. */
const AVATAR_KEY = 'kanbex.avatar'
const AVATAR_EVENT = 'kanbex:avatar-changed'
const AVATAR_SIZE = 160

export function readStoredAvatar(): string | null {
  try {
    return window.localStorage.getItem(AVATAR_KEY)
  } catch {
    return null
  }
}

export function storeAvatar(dataUrl: string): void {
  window.localStorage.setItem(AVATAR_KEY, dataUrl)
  window.dispatchEvent(new Event(AVATAR_EVENT))
}

export function clearStoredAvatar(): void {
  window.localStorage.removeItem(AVATAR_KEY)
  window.dispatchEvent(new Event(AVATAR_EVENT))
}

/** Аватар с подпиской на изменения: рельс и страница профиля
 *  обновляются синхронно после загрузки или удаления фото. */
export function useStoredAvatar(): string | null {
  const [avatar, setAvatar] = useState(() => readStoredAvatar())

  useEffect(() => {
    const sync = () => setAvatar(readStoredAvatar())

    window.addEventListener(AVATAR_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AVATAR_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return avatar
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

/** Квадратный кроп 160×160 + сжатие в JPEG, чтобы dataURL влезал в localStorage. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) return dataUrl

  const scale = Math.max(AVATAR_SIZE / image.width, AVATAR_SIZE / image.height)
  const width = image.width * scale
  const height = image.height * scale
  context.drawImage(image, (AVATAR_SIZE - width) / 2, (AVATAR_SIZE - height) / 2, width, height)
  return canvas.toDataURL('image/jpeg', 0.85)
}
