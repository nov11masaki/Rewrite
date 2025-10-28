document.addEventListener('DOMContentLoaded', function(){
  // Page elements
  const pageInput = document.getElementById('page-input')
  const pageRewrite = document.getElementById('page-rewrite')
  const pageTranslate = document.getElementById('page-translate')
  const pageFinal = document.getElementById('page-final')

  // Page 1: Input
  const inputText = document.getElementById('inputText')
  const btnNext1 = document.getElementById('btnNext1')
  const temperatureSlider = document.getElementById('temperatureSlider')
  const temperatureLabel = document.getElementById('temperatureLabel')
  const temperatureDescription = document.getElementById('temperatureDescription')

  // Page 2: Candidate Selection
  const originalText1 = document.getElementById('originalText1')
  const candidatesList = document.getElementById('candidatesList')
  const btnSelectCandidate = document.getElementById('btnSelectCandidate')
  const btnBack1 = document.getElementById('btnBack1')
  const loadingMessage = document.getElementById('loadingMessage')

  // Page 3: Translate
  const originalText = document.getElementById('originalText')
  const simplifiedText = document.getElementById('simplifiedText')
  const learnerText = document.getElementById('learnerText')
  const btnEvaluate = document.getElementById('btnEvaluate')
  const btnAssist = document.getElementById('btnAssist')
  const btnSubmit = document.getElementById('btnSubmit')
  const btnBack2 = document.getElementById('btnBack2')
  const assistResult = document.getElementById('assistResult')
  const evaluationResult = document.getElementById('evaluationResult')
  const translationScore = document.getElementById('translationScore')
  const translationComment = document.getElementById('translationComment')

  // Final page
  const finalOriginal = document.getElementById('finalOriginal')
  const finalSimplified = document.getElementById('finalSimplified')
  const finalLearner = document.getElementById('finalLearner')
  const finalEvaluation = document.getElementById('finalEvaluation')
  const finalAI = document.getElementById('finalAI')
  const btnRestart = document.getElementById('btnRestart')

  // State
  let currentOriginal = ''
  let currentSimplified = ''
  let currentAISuggestion = ''
  let currentEvaluation = ''
  let candidates = []
  let selectedCandidateId = null
  let currentTemperature = 0.7

  // Temperature slider handler
  temperatureSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value)
    currentTemperature = value / 10
    
    let label = ''
    let description = ''
    
    if (value <= 2) {
      label = `保守的 (${currentTemperature.toFixed(1)})`
      description = '元の文に非常に忠実で、似たような候補を生成します。安全で予測可能な結果が得られます。'
    } else if (value <= 4) {
      label = `やや保守的 (${currentTemperature.toFixed(1)})`
      description = '元の文に忠実でありながら、わずかな表現の違いを試します。'
    } else if (value <= 6) {
      label = `バランス型 (${currentTemperature.toFixed(1)})`
      description = '適度に多様な候補を生成します。元の文に忠実でありながら、いくつか異なる表現を試します。'
    } else if (value <= 8) {
      label = `やや創造的 (${currentTemperature.toFixed(1)})`
      description = 'より多様で創造的な候補を生成します。同じ意味でも大胆に異なる表現を試します。'
    } else {
      label = `創造的 (${currentTemperature.toFixed(1)})`
      description = '非常に多様で創造的な候補を生成します。意味は保ちながら、大きく異なる文構造を試します。'
    }
    
    temperatureLabel.textContent = label
    temperatureDescription.textContent = description
  })

  // Page 1 -> Page 2: Generate candidates
  btnNext1.addEventListener('click', async ()=>{
    const text = inputText.value.trim()
    if(!text){
      alert('問題文を入力してください')
      return
    }
    
    currentOriginal = text
    originalText1.textContent = text
    
    // Move to rewrite page and show loading
    pageInput.classList.add('hidden')
    pageRewrite.classList.remove('hidden')
    loadingMessage.classList.remove('hidden')
    candidatesList.innerHTML = ''
    btnSelectCandidate.disabled = true
    selectedCandidateId = null
    window.scrollTo({top:0, behavior:'smooth'})
    
    // Fetch candidates from API
    try {
      const res = await fetch('/simplify',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ 
          text: currentOriginal,
          temperature: currentTemperature
        })
      })
      const j = await res.json()
      
      if(!j.ok){
        alert(j.error||'エラーが発生しました')
        pageRewrite.classList.add('hidden')
        pageInput.classList.remove('hidden')
        return
      }
      
      candidates = j.candidates || []
      renderCandidates()
    } catch(e) {
      alert('通信エラーが発生しました')
      pageRewrite.classList.add('hidden')
      pageInput.classList.remove('hidden')
    } finally {
      loadingMessage.classList.add('hidden')
    }
  })

  function renderCandidates() {
    candidatesList.innerHTML = ''
    
    if(candidates.length === 0){
      candidatesList.innerHTML = '<p style="color:#999;">候補が生成されませんでした。</p>'
      return
    }
    
    candidates.forEach(candidate => {
      const card = document.createElement('div')
      card.className = 'candidate-card'
      card.dataset.id = candidate.id
      
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = 'candidate'
      radio.id = `candidate-${candidate.id}`
      radio.value = candidate.id
      
      const label = document.createElement('label')
      label.htmlFor = `candidate-${candidate.id}`
      label.style.cursor = 'pointer'
      label.style.flex = '1'
      
      const textDiv = document.createElement('div')
      textDiv.className = 'candidate-text'
      textDiv.textContent = candidate.text
      
      const explDiv = document.createElement('div')
      explDiv.className = 'candidate-explanation'
      explDiv.textContent = candidate.explanation
      
      label.appendChild(textDiv)
      label.appendChild(explDiv)
      
      card.appendChild(radio)
      card.appendChild(label)
      
      // Click handler
      card.addEventListener('click', () => {
        radio.checked = true
        selectedCandidateId = candidate.id
        btnSelectCandidate.disabled = false
        
        // Visual feedback
        document.querySelectorAll('.candidate-card').forEach(c => {
          c.classList.remove('selected')
        })
        card.classList.add('selected')
      })
      
      candidatesList.appendChild(card)
    })
  }

  // Page 2: Back to Page 1
  btnBack1.addEventListener('click', ()=>{
    pageRewrite.classList.add('hidden')
    pageInput.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })

  // Page 2 -> Page 3: Proceed with selected candidate
  btnSelectCandidate.addEventListener('click', ()=>{
    if(!selectedCandidateId){
      alert('候補を選択してください')
      return
    }
    
    const selected = candidates.find(c => c.id === selectedCandidateId)
    if(!selected){
      alert('選択された候補が見つかりません')
      return
    }
    
    currentSimplified = selected.text
    originalText.textContent = currentOriginal
    simplifiedText.textContent = currentSimplified
    
    pageRewrite.classList.add('hidden')
    pageTranslate.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })

  // Page 3: Back to Page 2
  btnBack2.addEventListener('click', ()=>{
    pageTranslate.classList.add('hidden')
    pageRewrite.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })


  // Page 3: Evaluate translation
  btnEvaluate.addEventListener('click', async ()=>{
    const learnerTranslation = learnerText.value.trim()
    if(!learnerTranslation){
      alert('英訳を入力してください')
      return
    }
    
    evaluationResult.classList.add('hidden')
    btnEvaluate.disabled = true
    btnEvaluate.textContent = 'AIが評価中...'
    
    try {
      const res = await fetch('/evaluate_translation',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          original: currentOriginal,
          simplified: currentSimplified,
          translation: learnerTranslation
        })
      })
      const j = await res.json()
      
      if(!j.ok){
        alert(j.error||'エラーが発生しました')
        return
      }
      
      currentEvaluation = `スコア: ${j.score}/100\n${j.comment}`
      translationScore.textContent = `スコア: ${j.score}/100`
      translationComment.textContent = j.comment
      evaluationResult.classList.remove('hidden')
    } catch(e) {
      alert('通信エラーが発生しました')
    } finally {
      btnEvaluate.disabled = false
      btnEvaluate.textContent = '英訳を評価してもらう'
    }
  })

  // Page 3: Request AI assistance
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

  // Page 3 -> Final: Submit and show final comparison
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
    finalEvaluation.textContent = currentEvaluation || '(評価なし)'
    finalAI.textContent = currentAISuggestion || '(AIの補助なし)'
    
    pageTranslate.classList.add('hidden')
    pageFinal.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })

  // Final page: Restart
  btnRestart.addEventListener('click', ()=>{
    // Clear all inputs and state
    inputText.value = ''
    learnerText.value = ''
    assistResult.textContent = ''
    assistResult.classList.add('hidden')
    evaluationResult.classList.add('hidden')
    candidatesList.innerHTML = ''
    
    currentOriginal = ''
    currentSimplified = ''
    currentAISuggestion = ''
    currentEvaluation = ''
    candidates = []
    selectedCandidateId = null
    
    // Return to first page
    pageFinal.classList.add('hidden')
    pageInput.classList.remove('hidden')
    window.scrollTo({top:0, behavior:'smooth'})
  })
})
