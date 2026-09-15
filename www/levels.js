// ملف: levels.js - محرك التلعيب، المستويات، والعقوبات

const LevelSystem = {
    profile: {
        level: 1, xp: 0, totalFocusMinutes: 0, perfectCycles: 0, penaltiesReceived: 0
    },

    titles: [
        { min: 1, name: "مبتدئ الإنتاجية 🐣", color: "var(--text-muted)", badgeGlow: "rgba(100, 116, 139, 0.3)" },
        { min: 5, name: "باحث عن التركيز 🧐", color: "var(--primary)", badgeGlow: "rgba(59, 130, 246, 0.4)" },
        { min: 10, name: "منظم الوقت ⏱️", color: "var(--success)", badgeGlow: "rgba(16, 185, 129, 0.4)" },
        { min: 20, name: "صائد الإنجازات 🎯", color: "var(--warning)", badgeGlow: "rgba(245, 158, 11, 0.4)" },
        { min: 30, name: "مهندس الساعات ⚙️", color: "var(--purple)", badgeGlow: "rgba(139, 92, 246, 0.5)" },
        { min: 40, name: "سيد التركيز 👁️‍🗨️", color: "var(--danger)", badgeGlow: "rgba(239, 68, 68, 0.6)" },
        { min: 50, name: "أسطورة المهام 👑", color: "var(--gold)", badgeGlow: "rgba(245, 158, 11, 0.8)" },
        { min: 100, name: "إمبراطور الإنتاجية 🌌", color: "var(--neon)", badgeGlow: "rgba(0, 240, 255, 0.9)" } // تم تغيير الاسم هنا
    ],

    init: function() {
        const saved = localStorage.getItem('chronoProfilePro');
        if (saved) { this.profile = JSON.parse(saved); } 
        else {
            const oldProfile = JSON.parse(localStorage.getItem('chronoProfile'));
            if(oldProfile) { this.profile.level = oldProfile.level || 1; this.profile.xp = oldProfile.xp || 0; }
        }
        this.updateUI();
    },

    save: function() { localStorage.setItem('chronoProfilePro', JSON.stringify(this.profile)); },

    getXpForNextLevel: function(level) { return Math.floor(100 * Math.pow(1.3, level - 1)); },

    getTitleObj: function(level) {
        let currentTitle = this.titles[0];
        for(let t of this.titles) { if(level >= t.min) currentTitle = t; }
        return currentTitle;
    },

    processCycle: function(cycleData) {
        let minutesFocused = Math.floor(cycleData.metrics.productiveCompleted / 60000);
        this.profile.totalFocusMinutes += minutesFocused;

        let finalScore = cycleData.finalScore;
        let xpChange = minutesFocused; 

        if (finalScore >= 95) { xpChange = Math.floor(xpChange * 1.5); this.profile.perfectCycles++; } 
        else if (finalScore >= 85) { xpChange = Math.floor(xpChange * 1.2); } 
        else if (finalScore < 50) { xpChange = Math.floor(xpChange * 0.3); }

        let hasFakeWork = cycleData.units.some(u => u.isFakeWork);
        if (hasFakeWork) { xpChange -= 100; this.profile.penaltiesReceived++; }
        if (cycleData.metrics.totalDistractions > 0) {
            let distracPenalty = cycleData.metrics.totalDistractions * 20; 
            xpChange -= distracPenalty; this.profile.penaltiesReceived++;
        }

        this.profile.xp += xpChange;
        cycleData.xpEarned = xpChange; 
        this.checkLevelProgression(xpChange);
        this.save(); this.updateUI();
    },

    checkLevelProgression: function(lastXpChange) {
        let leveledUp = false; let leveledDown = false; let oldLevel = this.profile.level;
        
        while (this.profile.xp >= this.getXpForNextLevel(this.profile.level)) {
            this.profile.xp -= this.getXpForNextLevel(this.profile.level); this.profile.level++; leveledUp = true;
        }
        while (this.profile.xp < 0 && this.profile.level > 1) {
            this.profile.level--; this.profile.xp += this.getXpForNextLevel(this.profile.level); leveledDown = true;
        }
        if (this.profile.level === 1 && this.profile.xp < 0) { this.profile.xp = 0; }

        if (leveledUp) { setTimeout(() => this.showLevelAlert('up', oldLevel), 1500); } 
        else if (leveledDown) { setTimeout(() => this.showLevelAlert('down', oldLevel), 1500); } 
        else if (lastXpChange < -30) {
            setTimeout(() => {
                if ("vibrate" in navigator) navigator.vibrate([200, 100, 300]);
                alert(`⚠️ نزيف نقاط!\nلقد فقدت ${Math.abs(lastXpChange)} XP بسبب العمل الوهمي أو التشتت الكبير.\nرصيدك في خطر، انتبه!`);
            }, 1500);
        }
    },

    updateUI: function() {
        const levelEl = document.getElementById('user-level-display'); const titleEl = document.getElementById('user-title-display');
        const fillEl = document.getElementById('user-xp-fill'); const badgeEl = document.getElementById('level-badge-ui');
        if(!levelEl || !titleEl || !fillEl || !badgeEl) return;

        levelEl.textContent = this.profile.level;
        let titleObj = this.getTitleObj(this.profile.level);
        titleEl.textContent = titleObj.name; titleEl.style.color = titleObj.color;
        badgeEl.style.boxShadow = `0 4px 15px ${titleObj.badgeGlow}`;

        if(this.profile.level >= 100) badgeEl.style.background = 'linear-gradient(135deg, #00F0FF, #0057FF)'; 
        else if(this.profile.level >= 50) badgeEl.style.background = 'linear-gradient(135deg, #F59E0B, #DC2626)'; 
        else if(this.profile.level >= 30) badgeEl.style.background = 'linear-gradient(135deg, #8B5CF6, #4C1D95)'; 
        else if(this.profile.level >= 10) badgeEl.style.background = 'linear-gradient(135deg, #10B981, #047857)'; 
        else badgeEl.style.background = 'linear-gradient(135deg, var(--gold), #D97706)'; 

        let reqXp = this.getXpForNextLevel(this.profile.level);
        let pct = Math.max(0, Math.min(100, (this.profile.xp / reqXp) * 100));
        fillEl.style.width = `${pct}%`;
        
        if (pct < 20 && this.profile.level > 1) { fillEl.style.background = 'var(--danger)'; fillEl.style.boxShadow = '0 0 8px var(--danger)'; } 
        else { fillEl.style.background = 'var(--primary)'; fillEl.style.boxShadow = 'none'; }
    },

    showLevelDetails: function() {
        const modal = document.getElementById('level-info-modal');
        const content = document.getElementById('level-details-content');
        if(!modal || !content) return;

        let reqXp = this.getXpForNextLevel(this.profile.level);
        let pct = Math.max(0, Math.min(100, (this.profile.xp / reqXp) * 100));
        let titleObj = this.getTitleObj(this.profile.level);

        let allLevelsHtml = '<div style="margin-top:20px; text-align:right; font-size:0.85rem; max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:12px; padding:10px; background:var(--bg-color);">';
        allLevelsHtml += '<div style="font-weight:900; margin-bottom:10px; text-align:center; color:var(--primary);"><i class="fa-solid fa-map-location-dot"></i> خريطة المستويات</div>';
        
        this.titles.forEach((t, index) => {
            let nextMin = this.titles[index+1] ? this.titles[index+1].min : 999;
            let isCurrent = this.profile.level >= t.min && this.profile.level < nextMin;
            let isPassed = this.profile.level >= nextMin;
            
            let itemStyle = isCurrent ? 'background:var(--primary); color:white; border-radius:8px; font-weight:bold; padding:8px;' : (isPassed ? 'color:var(--success); padding:5px;' : 'color:var(--text-muted); padding:5px; opacity:0.6');
            let icon = isCurrent ? '<i class="fa-solid fa-location-crosshairs"></i>' : (isPassed ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-lock"></i>');
            
            allLevelsHtml += `<div style="${itemStyle} display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span>${t.name}</span>
                                <span style="direction:ltr;">${icon} Lvl ${t.min}</span>
                              </div>`;
        });
        allLevelsHtml += '</div>';

        content.innerHTML = `
            <div style="font-size: 3.5rem; margin-bottom: 5px; text-shadow: 0 5px 15px rgba(0,0,0,0.1);">${titleObj.name.split(' ')[titleObj.name.split(' ').length-1]}</div>
            <h2 style="color: ${titleObj.color}; margin-bottom: 0;">${titleObj.name.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')}</h2>
            <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 20px; color:var(--text-muted);">المستوى الحالي: ${this.profile.level}</div>
            
            <div style="background: var(--card-bg); padding: 15px; border-radius: 15px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; font-weight:900; margin-bottom:10px;">
                    <span><i class="fa-solid fa-bolt" style="color:var(--purple)"></i> نقاط الـ XP</span>
                    <span style="direction:ltr; color:var(--text-main);">${this.profile.xp} / ${reqXp}</span>
                </div>
                <div class="progress-track" style="height: 12px; margin:0; background: var(--border-color); border-radius:20px; overflow:hidden;">
                    <div class="progress-fill" style="width: ${pct}%; background: ${pct < 20 && this.profile.level > 1 ? 'var(--danger)' : 'linear-gradient(90deg, var(--primary), var(--purple))'}"></div>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:10px; font-weight:bold;">
                    ينقصك <span style="color:var(--primary)">${reqXp - this.profile.xp} XP</span> للارتقاء للمستوى القادم!
                </div>
            </div>
            ${allLevelsHtml}
        `;
        
        modal.style.display = 'flex';
    },

    showLevelAlert: function(type, oldLevel) {
        if (type === 'up') {
            if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 300, 100, 400]);
            alert(`🎉 LEVEL UP! 🎉\n\nإنجاز أسطوري يا بطل الإنتاجية!\nلقد ارتقيت من المستوى ${oldLevel} إلى المستوى ${this.profile.level}.\nاللقب الجديد: ${this.getTitleObj(this.profile.level).name}`);
        } else {
            if ("vibrate" in navigator) navigator.vibrate([400, 100, 400, 100, 600]);
            alert(`💀 LEVEL DOWN! 💀\n\nتراجع كارثي! بسبب عدم الانضباط المستمر، تم تجريدك من مستواك وهبطت إلى المستوى ${this.profile.level}.\nلا تدع التشتت وتسويف الأهداف يهزمك مجدداً!`);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { LevelSystem.init(); });