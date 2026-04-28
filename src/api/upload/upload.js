import api from '../../lib/axios'

export const uploadImage = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload/image', form)
}

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload/file', form)
}

export const uploadAudio = (blob) => {
  const form = new FormData()
  form.append('file', blob, 'voice.webm')
  return api.post('/upload/audio', form)
}
