// ملف: analytics.js - التقييم والملاحظات والسجل

function triggerManualReport() {
    if (confirm('تنبيه: إنهاء التحدي مبكراً قبل انتهاء الوقت سيتم حسابه في التقييم. متأكد من الاستسلام الآن؟')) {
        processCycleEnd();
    }
}

function getRankData(score) {
    if (score >= 95) return { letter: 'S', name: 'أسطوري', color: '#F59E0B', class: 'rank-S' };
    if (score >= 85) return { letter: 'A', name: 'ممتاز', color: '#8B5CF6', class: 'rank-A' };
    if (score >= 70) return { letter: 'B', name: 'جيد جداً', color: '#3B82F6', class: 'rank-B' };
    if (score >= 55) return { letter: 'C', name: 'متوسط', color: '#10B981', class: 'rank-C' };
    if (score >= 40) return { letter: 'D', name: 'مقبول', color: '#F59E0B', class: 'rank-D' };
    return { letter: 'F', name: 'كارثي', color: '#EF4444', class: 'rank-F' };
}

function processCycleEnd() {
    syncBackgroundTime(); 
    if (timerInterval) clearInterval(timerInterval); 
    document.body.classList.remove('active-bg');
    playHapticSound('end'); vibrate([200, 100, 200, 100, 400]);

    let productiveAllocated = 0; 
    let productiveCompleted = 0; 
    let totalOvertimeMs = 0; 
    let totalUnderTimeMs = 0; 
    let emptyOvertimeMs = 0;
    let totalDistractions = state.distractions || 0;

    state.units.forEach(u => {
        if (u.id !== 'u_empty') {
            productiveAllocated += u.allocatedMs; 
            
            let achCompletionMultiplier = 1;
            if (u.achievements && u.achievements.length > 0) {
                let doneCount = u.achievements.filter(a => a.done).length;
                achCompletionMultiplier = doneCount / u.achievements.length;
                u.isFakeWork = achCompletionMultiplier < 1; 
            } else {
                u.isFakeWork = false;
            }

            let rawTimeCompleted = Math.min(u.usedMs, u.allocatedMs);
            let verifiedCompleted = rawTimeCompleted * achCompletionMultiplier; 
            
            productiveCompleted += verifiedCompleted;
            u.verifiedCompleted = verifiedCompleted; 

            if (u.usedMs > u.allocatedMs) totalOvertimeMs += (u.usedMs - u.allocatedMs);
            if (u.usedMs < u.allocatedMs) totalUnderTimeMs += (u.allocatedMs - u.usedMs);
        } else {
            if (u.usedMs > u.allocatedMs) emptyOvertimeMs += (u.usedMs - u.allocatedMs);
        }
    });
    
    let baseScore = productiveAllocated > 0 ? (productiveCompleted / productiveAllocated) * 100 : 100;
    
    let overtimePenalty = (totalOvertimeMs / state.cycleTotalMs) * 100 * 0.25;
    let emptyPenalty = (emptyOvertimeMs / state.cycleTotalMs) * 100 * 0.5;
    let distractionPenalty = totalDistractions * 2.5; 
    
    let finalScore = baseScore - overtimePenalty - emptyPenalty - distractionPenalty;
    finalScore = Math.max(0, Math.min(100, finalScore));

    let planningAccuracy = 100 - (((totalOvertimeMs + totalUnderTimeMs + emptyOvertimeMs) / state.cycleTotalMs) * 100);
    planningAccuracy = Math.max(0, Math.min(100, planningAccuracy));

    let completedCycle = { 
        ...state, endDate: Date.now(), finalScore: finalScore,
        metrics: { planningAccuracy, totalOvertimeMs, emptyOvertimeMs, productiveAllocated, productiveCompleted, totalDistractions }
    };

    if (typeof LevelSystem !== 'undefined') {
        LevelSystem.processCycle(completedCycle);
    }

    historyData.push(completedCycle); localStorage.setItem('chronoHistory', JSON.stringify(historyData));
    localStorage.removeItem('chronoMasterData');
    
    state = { cycleName: "", isRunning: false, cycleTotalMs: 24 * 3600000, units: [], activeUnitId: null, distractions: 0 };
    document.getElementById('cycle-preset').value = "1440"; document.getElementById('cycle-name-input').value = "";
    
    updateNavUI(); toggleCustomCycle(); updateSetupUI();
    renderReport(completedCycle);
}

function renderReport(cycleData) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active')); 
    ['setup-view', 'tracker-view', 'history-view'].forEach(v => document.getElementById(v).style.display = 'none');
    document.getElementById('report-view').style.display = 'block';

    const titleEl = document.getElementById('report-cycle-name-display');
    if (cycleData.cycleName) { titleEl.textContent = cycleData.cycleName; titleEl.style.display = 'block'; } else titleEl.style.display = 'none';

    let rankInfo = getRankData(cycleData.finalScore);
    document.getElementById('report-rank-container').innerHTML = `
        <div class="rank-badge ${rankInfo.class}">${rankInfo.letter}</div>
        <div class="rank-details">
            <div class="score-label-rank">التقييم (${rankInfo.name})</div>
            <div class="score-huge" style="color: ${rankInfo.color}">${cycleData.finalScore.toFixed(1)}%</div>
        </div>
    `;

    let bestTask = null; let bestScore = -1; let worstTask = null; let worstScore = -1;
    let unitsHtml = '';
    let hasFakeWork = false;

    cycleData.units.forEach(u => {
        let completionPct = u.allocatedMs > 0 ? (Math.min(u.usedMs, u.allocatedMs) / u.allocatedMs) * 100 : 100;
        let overtimeMs = u.usedMs > u.allocatedMs ? u.usedMs - u.allocatedMs : 0;
        let overtimePct = u.allocatedMs > 0 ? (overtimeMs / u.allocatedMs) * 100 : (overtimeMs > 0 ? 100 : 0);
        let emptyExceeded = (u.id === 'u_empty' && overtimeMs > 0);

        if (u.id !== 'u_empty') {
            let actualValuePct = u.allocatedMs > 0 ? (u.verifiedCompleted / u.allocatedMs) * 100 : 100;
            let taskScore = actualValuePct - (overtimePct * 0.5);
            if (taskScore > bestScore && !u.isFakeWork) { bestScore = taskScore; bestTask = u; }
            if (u.isFakeWork) hasFakeWork = true;
        }
        if (overtimeMs > worstScore || u.isFakeWork) { worstScore = overtimeMs + (u.isFakeWork ? 999999 : 0); worstTask = u; }

        let fakeWorkLabel = u.isFakeWork ? `<span style="color:var(--danger); font-size:0.75rem; background:rgba(239,68,68,0.1); padding:2px 6px; border-radius:5px; margin-right:5px;"><i class="fa-solid fa-triangle-exclamation"></i> عمل وهمي</span>` : '';
        let statusColor = u.isFakeWork ? 'var(--danger)' : (emptyExceeded ? 'var(--danger)' : (completionPct >= 99 ? 'var(--success)' : 'var(--warning)'));
        
        let achText = '';
        if(u.achievements && u.achievements.length > 0) {
            let done = u.achievements.filter(a=>a.done).length;
            achText = `<div style="font-size:0.8rem; margin-top:5px; color:var(--text-muted)"><i class="fa-solid fa-list-check"></i> الأهداف المشروطة: ${done}/${u.achievements.length} ${u.isFakeWork ? '(أفشلت المهمة)' : '(مكتمل)'}</div>`;
        }

        unitsHtml += `
        <div class="report-unit-item">
            <div style="display:flex; justify-content: space-between; margin-bottom: 8px; align-items:center;">
                <strong>${u.name} ${fakeWorkLabel}</strong>
                <strong style="color: ${statusColor}; font-size:1.1rem">${u.isFakeWork ? '0%' : completionPct.toFixed(0) + '%'}</strong>
            </div>
            <div class="progress-track" style="height: 6px; margin: 0; background:var(--border-color)">
                <div class="progress-fill" style="width: ${u.isFakeWork ? 0 : Math.min(100, completionPct)}%; background: ${statusColor}"></div>
            </div>
            ${achText}
            <div style="font-size:0.85rem; margin-top:8px; display:flex; justify-content:space-between; font-weight:600;">
                <span style="color:var(--text-muted)">المخطط: <span class="ltr-text">${formatTime(u.allocatedMs, true)}</span></span>
                <span style="color:var(--text-main)">مستغرق: <span class="ltr-text">${formatTime(u.usedMs, true)}</span></span>
            </div>
            ${overtimeMs > 0 ? `<div style="font-size:0.8rem; color:var(--danger); margin-top:3px;"><i class="fa-solid fa-arrow-up"></i> تجاوز بـ ${formatTime(overtimeMs, true)}</div>` : ''}
        </div>`;
    });

    document.getElementById('report-units-breakdown').innerHTML = unitsHtml || '<div class="report-unit-item">لا توجد تفاصيل.</div>';
    document.getElementById('report-best-task').textContent = bestTask && bestScore >= 50 ? bestTask.name : 'لا يوجد استقرار';
    
    if(worstTask && worstTask.isFakeWork) {
        document.getElementById('report-worst-task').innerHTML = `${worstTask.name} <br><span style="font-size:0.7rem">(عمل وهمي ضائع)</span>`;
        document.getElementById('report-worst-task').style.color = 'var(--danger)';
    } else {
        document.getElementById('report-worst-task').textContent = worstTask && worstScore > 60000 ? worstTask.name : 'أداء نظيف!';
        document.getElementById('report-worst-task').style.color = worstTask && worstScore > 60000 ? 'var(--danger)' : 'var(--success)';
    }

    let productiveEfficiency = cycleData.metrics.productiveAllocated > 0 ? (cycleData.metrics.productiveCompleted / cycleData.metrics.productiveAllocated) * 100 : 100;
    let distracHtml = cycleData.metrics.totalDistractions > 0 ? `<div class="kpi-row"><div class="kpi-header"><span style="color:var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> المشتتات المسجلة</span> <strong style="color:var(--danger)">${cycleData.metrics.totalDistractions} (خصم ${(cycleData.metrics.totalDistractions * 2.5).toFixed(1)}%)</strong></div></div>` : '';

    document.getElementById('report-kpi-container').innerHTML = `
        <div class="kpi-row">
            <div class="kpi-header"><span>دقة التخطيط الزمني</span> <span class="ltr-text">${cycleData.metrics.planningAccuracy.toFixed(1)}%</span></div>
            <div class="kpi-bar-bg"><div class="kpi-bar-fill" style="width: ${cycleData.metrics.planningAccuracy}%; background: ${cycleData.metrics.planningAccuracy > 80 ? 'var(--primary)' : 'var(--warning)'}"></div></div>
        </div>
        <div class="kpi-row">
            <div class="kpi-header"><span>كفاءة الإنجاز الصافي (القيمة الفعلية)</span> <span class="ltr-text">${productiveEfficiency.toFixed(1)}%</span></div>
            <div class="kpi-bar-bg"><div class="kpi-bar-fill" style="width: ${productiveEfficiency}%; background: ${productiveEfficiency > 90 ? 'var(--success)' : 'var(--primary)'}"></div></div>
        </div>
        ${distracHtml}
    `;

    let insightsList = [];
    
    if (rankInfo.letter === 'S') insightsList.push("أداء استثنائي! إدارة الوقت لديك في مستوى الخبراء ولا يوجد أي تسرب للوقت.");
    else if (rankInfo.letter === 'A') insightsList.push("أداء ممتاز، لكن هناك مجال صغير للتحسين لتبلغ الكمال المطلق.");
    else if (rankInfo.letter === 'B') insightsList.push("إنجاز جيد، غير أن التخطيط يحتاج إلى صرامة أكبر لتجنب الهدر.");
    else insightsList.push("أداء غير مرضي. لقد فقدت السيطرة على الوقت والأهداف الأساسية في هذه الدورة.");

    if (hasFakeWork && worstTask) {
        insightsList.push(`تم رصد <strong style="color:var(--danger)">"عمل وهمي"</strong> في مهمة "${worstTask.name}". لقد قضيت الوقت المخصص دون إنجاز الأهداف الضرورية، مما أدى لاحتراق نسبة المهمة بالكامل.`);
    }

    if (cycleData.metrics.totalDistractions > 0) {
        let severity = cycleData.metrics.totalDistractions > 3 ? "كارثي ومُدمر للزخم الذهني" : "مؤثر على التركيز العميق";
        insightsList.push(`تم تسجيل <strong style="color:var(--danger)">${cycleData.metrics.totalDistractions} حالات تشتت</strong>. هذا المعدل ${severity}.`);
    }

    let emptyMin = Math.floor(cycleData.metrics.emptyOvertimeMs / 60000);
    if (emptyMin > 0) {
        insightsList.push(`تجاوزت وقت الاستراحة (الفارغ) بمقدار <strong style="color:var(--warning)">${emptyMin} دقيقة</strong>، الاستراحات الطويلة تقتل الإنتاجية.`);
    }

    let overMin = Math.floor(cycleData.metrics.totalOvertimeMs / 60000);
    if (overMin > 0) {
        insightsList.push(`أخذت المهام الإنتاجية وقتاً إضافياً مقداره <strong style="color:var(--primary)">${overMin} دقيقة</strong> عن المخطط. يُنصح بإعطاء المهام وقتاً أكثر واقعية مستقبلاً.`);
    }

    if (bestTask && !bestTask.isFakeWork && bestTask.id !== 'u_empty' && bestScore > 70) {
        insightsList.push(`المهمة <strong>"${bestTask.name}"</strong> كانت درعك الواقي اليوم وأكثر مهمة التزمت بها بدقة.`);
    }

    let combinedInsightHtml = `<div style="font-size:1.1rem; color:var(--primary); margin-bottom:10px;"><i class="fa-solid fa-robot"></i> تحليل الذكاء الاصطناعي:</div>`;
    combinedInsightHtml += `<ul class="insight-list">` + insightsList.map(item => `<li>${item}</li>`).join('') + `</ul>`;
    
    document.getElementById('report-insight-text').innerHTML = combinedInsightHtml;
}

function showHistory(el, idx) {
    navTo('history-view', el || document.getElementById('nav-history'), idx || 2);
    const list = document.getElementById('history-list'); 
    list.innerHTML = '';
    
    if (historyData.length === 0) { 
        list.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted)"><i class="fa-solid fa-ghost" style="font-size:3rem; margin-bottom:10px; opacity:0.5"></i><br>لم تبدأ رحلتك بعد.</div>'; 
    } else {
        historyData.slice().reverse().forEach((cycle, index) => {
            let actualIndex = historyData.length - 1 - index;
            let dateStr = new Date(cycle.endDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
            let unitCount = cycle.units.filter(u => u.id !== 'u_empty').length;
            let nameTitle = cycle.cycleName ? `<div style="font-weight:900; font-size:1.1rem; color:var(--text-main); margin-bottom:4px;">${cycle.cycleName}</div>` : '';
            let rank = getRankData(cycle.finalScore);

            list.innerHTML += `
            <div class="history-item" onclick="openHistoryReport(${actualIndex})">
                <div style="flex:1;">
                    ${nameTitle}
                    <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px"><i class="fa-regular fa-calendar"></i> ${dateStr}</div>
                    <div class="flex-info-row">
                        <span>المدة: <span class="ltr-text">${formatTime(cycle.cycleTotalMs, false)}</span></span> | <span>المهام: ${unitCount}</span>
                    </div>
                </div>
                <div class="history-score" style="border-color:${rank.color}; color:${rank.color}; width:50px; height:50px; display:flex; justify-content:center; align-items:center; font-size:1.5rem">${rank.letter}</div>
            </div>`;
        });
    }
}

function openHistoryReport(index) { renderReport(historyData[index]); }