'use client'
import { useState, useEffect, useRef } from 'react'

export function useVoice(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  function pickBestVoice(): SpeechSynthesisVoice | null {
    const voices = voicesRef.current
    if (!voices.length) return null
    const rishi = voices.find((v) => v.name === 'Rishi' && v.lang === 'en-IN')
    if (rishi) return rishi
    const anyIndian = voices.find((v) => v.lang === 'en-IN')
    if (anyIndian) return anyIndian
    const naturalNames = ['Google US English', 'Samantha', 'Microsoft Aria', 'Google UK English Female']
    for (const name of naturalNames) {
      const match = voices.find((v) => v.name.includes(name))
      if (match) return match
    }
    const anyEnglish = voices.find((v) => v.lang.startsWith('en'))
    return anyEnglish || voices[0]
  }

  function startListening() {
    // @ts-ignore
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input needs Chrome or Edge browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      onResult(text)
    }
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  function speak(text: string, onDone?: () => void) {
    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*_#`]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)

    const voice = pickBestVoice()
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    utterance.rate = 1.15
    utterance.pitch = 1.4

    utterance.onstart = () => {
      setSpeaking(true)
    }
    
    utterance.onend = () => {
      setSpeaking(false)
      if (onDone) onDone()
    }
    
    utterance.onerror = (event: any) => {
      console.log('SPEECH ERROR:', event.error)
      setSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  function startWakeWordListening(onWake: () => void) {
    // @ts-ignore
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported')
      return { stop: () => {} }
    }
    
    let shouldRestart = true
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    // Keeping continuous true so it doesn't shut off, but we will ignore the AI's dictation string
    recognition.continuous = true 
    recognition.interimResults = true
    
    recognition.onstart = () => console.log('Wake word listener active (Background)')
    
    recognition.onresult = (event: any) => {
      // We only extract the very latest chunk of audio processed
      const latestTranscript = event.results[event.results.length - 1][0].transcript.toLowerCase()
      
      // Removed the console.log spam here so it doesn't print the AI's own dictation

      if (latestTranscript.includes('jarvis')) {
        console.log('⚡ Wake word "Jarvis" detected!')
        shouldRestart = false
        recognition.stop()
        onWake()
      }
    }
    
    recognition.onerror = (event: any) => {
      // Ignore routine no-speech errors that happen during silence
      if (event.error !== 'no-speech') {
        console.log('Wake word error:', event.error)
      }
    }
    
    recognition.onend = () => {
      if (shouldRestart) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch (e) {
            // Ignore restart collisions
          }
        }, 300)
      }
    }
    
    recognition.start()
    
    return {
      stop: () => {
        shouldRestart = false
        recognition.stop()
      },
    }
  }

  return { listening, speaking, startListening, speak, stopSpeaking, startWakeWordListening }
}