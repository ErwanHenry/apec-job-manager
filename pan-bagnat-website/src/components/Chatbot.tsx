'use client'

import { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis votre assistant Pan Bagnat. Comment puis-je vous aider à découvrir notre tradition niçoise ?',
      isBot: true,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')

  const botResponses = {
    tradition: 'Le Pan Bagnat est un sandwich traditionnel niçois composé de pain rond, tomates, anchois, olives noires, œufs durs, poivrons, radis, et huile d\'olive. Il symbolise l\'authenticité méditerranéenne.',
    ingredientes: 'Les ingrédients traditionnels du Pan Bagnat : pain de campagne rond, tomates bien mûres, anchois de Méditerranée, olives noires de Nice, œufs durs, poivrons, radis, basilic, et huile d\'olive extra vierge.',
    histoire: 'Le Pan Bagnat existe depuis le 19ème siècle à Nice. "Pan bagnat" signifie "pain mouillé" en niçois, car le pain s\'imprègne des saveurs des légumes et de l\'huile d\'olive.',
    événements: 'Nous organisons régulièrement des festivals, ateliers de préparation, et dégustations. Consultez notre calendrier d\'événements pour participer !',
    default: 'Je suis là pour vous parler du Pan Bagnat niçois ! Vous pouvez me demander des informations sur la tradition, les ingrédients, l\'histoire, ou nos événements.'
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Simple keyword-based responses
    let botResponse = botResponses.default
    const lowerInput = inputText.toLowerCase()

    if (lowerInput.includes('tradition') || lowerInput.includes('qu\'est-ce que')) {
      botResponse = botResponses.tradition
    } else if (lowerInput.includes('ingrédients') || lowerInput.includes('composition')) {
      botResponse = botResponses.ingredientes
    } else if (lowerInput.includes('histoire') || lowerInput.includes('origine')) {
      botResponse = botResponses.histoire
    } else if (lowerInput.includes('événement') || lowerInput.includes('festival')) {
      botResponse = botResponses.événements
    }

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    }, 1000)

    setInputText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-nice-blue hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-40">
          {/* Header */}
          <div className="bg-nice-blue text-white p-4 rounded-t-lg">
            <h3 className="font-semibold">Assistant Pan Bagnat</h3>
            <p className="text-sm opacity-90">Posez-moi vos questions !</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-nice-blue text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Votre question..."
                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nice-blue"
              />
              <button
                onClick={handleSendMessage}
                className="bg-nice-blue hover:bg-blue-700 text-white p-2 rounded-md transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}