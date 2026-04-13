import { useState } from 'react'
import PublicPrototype from './screens/PublicPrototype'
import PublicPrototypeV2 from './screens/PublicPrototypeV2'
import PublicPrototypeV3 from './screens/PublicPrototypeV3'
import SystemDesign from './screens/SystemDesign'
import UIKitReference from './screens/UIKitReference'

type View = 'home' | 'v1' | 'v2' | 'v3' | 'sys' | 'uikit'

export default function App() {
  const [view, setView] = useState<View>('home');

  const btnClass = (v: View) =>
    `px-3 py-1.5 font-bold text-xs backdrop-blur border transition-colors shadow-xl ${
      view === v
        ? 'bg-primary-500 text-white border-primary-500'
        : 'bg-black/80 text-white/60 border-white/10 hover:text-white'
    }`

  return (
    <div>
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button onClick={() => setView('home')} className={btnClass('home')}>HOME</button>
          <button onClick={() => setView('v1')} className={btnClass('v1')}>V1</button>
          <button onClick={() => setView('v2')} className={btnClass('v2')}>V2</button>
          <button onClick={() => setView('v3')} className={btnClass('v3')}>V3</button>
          <button onClick={() => setView('sys')} className={btnClass('sys')}>SYS</button>
          <button onClick={() => setView('uikit')} className={btnClass('uikit')}>UIKIT</button>
        </div>
      </div>

      {view === 'v1' && <PublicPrototype />}
      {view === 'v2' && <PublicPrototypeV2 />}
      {view === 'v3' && <PublicPrototypeV3 />}
      {view === 'sys' && <SystemDesign />}
      {view === 'uikit' && <UIKitReference />}
    </div>
  )
}
