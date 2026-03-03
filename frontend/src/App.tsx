import { useState } from 'react'
import PublicPrototype from './screens/PublicPrototype'
import PublicPrototypeV2 from './screens/PublicPrototypeV2'
import PublicPrototypeV3 from './screens/PublicPrototypeV3'
import SystemDesign from './screens/SystemDesign'
import UIKitReference from './screens/UIKitReference'

export default function App() {
  const [showUIKitRef, setShowUIKitRef] = useState(false);
  const [prototypeVersion, setPrototypeVersion] = useState<1 | 2 | 3 | 4>(1);

  return (
    <div className="theme-siesta-tan">
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">

        <button
          onClick={() => setShowUIKitRef(!showUIKitRef)}
          className="bg-primary-400/80 text-white px-4 py-2 rounded-full font-bold text-xs backdrop-blur border border-primary-400/50 hover:bg-primary-400 transition-colors shadow-2xl"
        >
          {showUIKitRef ? 'Back to Prototype' : 'View UI Kit Ref'}
        </button>

        {!showUIKitRef && (
          <div className="flex gap-2">
            <button
              onClick={() => setPrototypeVersion(1)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs backdrop-blur border transition-colors shadow-xl ${prototypeVersion === 1
                ? 'bg-primary-400 text-white border-primary-400'
                : 'bg-black/80 text-white/60 border-white/10 hover:text-white'
                }`}
            >
              V1
            </button>
            <button
              onClick={() => setPrototypeVersion(2)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs backdrop-blur border transition-colors shadow-xl ${prototypeVersion === 2
                ? 'bg-tertiary-400 text-black border-tertiary-400'
                : 'bg-black/80 text-white/60 border-white/10 hover:text-white'
                }`}
            >
              V2
            </button>
            <button
              onClick={() => setPrototypeVersion(3)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs backdrop-blur border transition-colors shadow-xl ${prototypeVersion === 3
                ? 'bg-secondary-400 text-white border-secondary-400'
                : 'bg-black/80 text-white/60 border-white/10 hover:text-white'
                }`}
            >
              V3
            </button>
            <button
              onClick={() => setPrototypeVersion(4 as any)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs backdrop-blur border transition-colors shadow-xl ${prototypeVersion === 4
                ? 'bg-pink-500 text-white border-pink-500'
                : 'bg-black/80 text-white/60 border-white/10 hover:text-white'
                }`}
            >
              SYS
            </button>
          </div>
        )}
      </div>

      {showUIKitRef ? (
        <UIKitReference />
      ) : prototypeVersion === 1 ? (
        <PublicPrototype />
      ) : prototypeVersion === 2 ? (
        <PublicPrototypeV2 />
      ) : prototypeVersion === 3 ? (
        <PublicPrototypeV3 />
      ) : (
        <SystemDesign />
      )}
    </div>
  )
}
