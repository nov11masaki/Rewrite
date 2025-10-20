document.addEventListener('DOMContentLoaded', function(){
  // Stage elements
  const stageInput = document.getElementById('stage-input')
  const stageSimplified = document.getElementById('stage-simplified')
  const stageLearner = document.getElementById('stage-learner')
  const stageFinal = document.getElementById('stage-final')

  // Stage 1: Input
  const inputText = document.getElementById('inputText')
  const btnSimplify = document.getElementById('btnSimplify')

  // Stage 2: Simplified confirmation
  const originalText = document.getElementById('originalText')
  const simplifiedText = document.getElementById('simplifiedText')
  const scoreEl = document.getElementById('score')
  const btnProceed = document.getElementById('btnProceed')
  const btnRetry = document.getElementById('btnRetry')

  // Stage 3: Learner translation
  const referenceText = document.getElementById('referenceText')
  const learnerText = document.getElementById('learnerText')
  const btnAssist = document.getElementById('btnAssist')
  const btnSubmit = document.getElementById('btnSubmit')
  const btnBackSimplified = document.getElementById('btnBackSimplified')
  const assistResult = document.getElementById('assistResult')

  // Stage 4: Final confirmation
  const finalOriginal = document.getElementById('finalOriginal')
  const finalSimplified = document.getElementById('finalSimplified')
  const finalLearner = document.getElementById('finalLearner')
  const finalAI = document.getElementById('finalAI')
  const btnRestart = document.getElementById('btnRestart')

  // State
  let currentOriginal = ''
  let currentSimplified = ''
  let currentAISuggestion = ''

  // Step 1: Simplify Japanese text
  btnSimplify.addEventListener('click', async ()=>{
    const text = inputText.value.trim()
    if(!text){
      alert('テキストを入力してください')
      return
    }
    
    currentOriginal = text
    btnSimplify.disabled = true
    btnSimplify.textContent = 'AIが変換中...'
    
    try {
      const res = await fetch('/simplify',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text})
      })
      const j = await res.json()
      
      if(!j.ok){
        alert(j.error||'エラーが発生しました')
        return
      }
      
      currentSimplified = j.simplified
      originalText.textContent = currentOriginal
      simplifiedText.textContent = currentSimplified
      scoreEl.textContent = '✓ 翻訳しやすさスコア: '+j.score+'/100 (AIが評価)'
      
      // Move to confirmation stage
      stageInput.classList.add('hidden')
      stageSimplified.classList.remove('hidden')
      window.scrollTo({top:0, behavior:'smooth'})
    } catch(e) {
      alert('通信エラーが発生しました')
    } finally {
      btnSimplify.disabled = false
      btnSimplify.textContent = '翻訳しやすい日本語に変換'
    }
  })

  // Step 2: Confirm or retry simplification
  btnProceed.addEventListener('click', ()=>{
    referenceText.textContent = currentSimplified
    stageSimplified.classList.add('hidden')
    stageLearner.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })
  
  btnRetry.addEventListener('click', ()=>{
    stageSimplified.classList.add('hidden')
    stageInput.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })

  // Step 3: Back to confirmation
  btnBackSimplified.addEventListener('click', ()=>{
    stageLearner.classList.add('hidden')
    stageSimplified.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })

  // Step 3: Request AI assistance
  btnAssist.addEventListener('click', async ()=>{
    assistResult.classList.add('hidden')
    btnAssist.disabled = true
    btnAssist.textContent = 'AIで補助中...'
    
    try {
      const res = await fetch('/assist_translate',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          simplified: currentSimplified,
          learner: learnerText.value
        })
      })
      const j = await res.json()
      
      if(!j.ok){
        alert(j.error||'エラーが発生しました')
        return
      }
      
      currentAISuggestion = j.suggestion
      assistResult.textContent = '💡 AI提案:\n' + currentAISuggestion
      assistResult.classList.remove('hidden')
    } catch(e) {
      alert('通信エラーが発生しました')
    } finally {
      btnAssist.disabled = false
      btnAssist.textContent = 'AIで補助'
    }
  })

  // Step 3: Submit and show final comparison
  btnSubmit.addEventListener('click', ()=>{
    const learnerTranslation = learnerText.value.trim()
    
    if(!learnerTranslation){
      if(!confirm('英訳が入力されていませんが、完了しますか？')){
        return
      }
    }
    
    finalOriginal.textContent = currentOriginal
    finalSimplified.textContent = currentSimplified
    finalLearner.textContent = learnerTranslation || '(未入力)'
    finalAI.textContent = currentAISuggestion || '(AIの補助なし)'
    
    stageLearner.classList.add('hidden')
    stageFinal.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })

  // Step 4: Restart with new text
  btnRestart.addEventListener('click', ()=>{
    // Clear all inputs and state
    inputText.value = ''
    learnerText.value = ''
    assistResult.textContent = ''
    assistResult.classList.add('hidden')
    
    currentOriginal = ''
    currentSimplified = ''
    currentAISuggestion = ''
    
    // Return to first stage
    stageFinal.classList.add('hidden')
    stageInput.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })
})
