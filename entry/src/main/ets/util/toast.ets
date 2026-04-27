/**
 * Toast 轻提示
 */
import promptAction from '@ohos.promptAction'

export async function showToast(message: string, duration: number = 2000): Promise<void> {
  promptAction.showToast({ message, duration })
}

export async function showToastSuccess(message: string): Promise<void> {
  promptAction.showToast({ message: `✅ ${message}` })
}

export async function showToastError(message: string): Promise<void> {
  promptAction.showToast({ message: `❌ ${message}` })
}
