const element = document.body.querySelector('.output')!

export function log(...messages: string[]) {
  element.innerHTML = messages.join('<br>')
}
