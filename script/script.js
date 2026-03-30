(function () {
    const savedTheme = localStorage.getItem('classLayoutTheme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    document.body.setAttribute('data-theme', theme);
})();

let manualStatus = [];

function saveData() {
    const data = {
        studentCount: document.getElementById('studentCount').value,
        rowCount: document.getElementById('rowCount').value,
        colCount: document.getElementById('colCount').value,
        pairing: document.getElementById('pairing').checked,
        viewMode: document.getElementById('viewMode').checked,
        excludeStudents: document.getElementById('excludeStudents').value,
        autoDownloadHwp: document.getElementById('autoDownloadHwp').checked,
        manualStatus: manualStatus,
        seatContainerHTML: document.getElementById('seatContainer').innerHTML
    };
    localStorage.setItem('classLayoutData', JSON.stringify(data));
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('classLayoutTheme', newTheme);
}

function initializeSeats() {
    const rowCount = parseInt(document.getElementById('rowCount').value) || 4;
    const colCount = parseInt(document.getElementById('colCount').value) || 5;

    const seatContainer = document.getElementById('seatContainer');
    seatContainer.innerHTML = '';
    seatContainer.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;

    const totalSeats = rowCount * colCount;

    if (manualStatus.length !== totalSeats) {
        manualStatus = Array(totalSeats).fill(1);
    }

    for (let i = 0; i < totalSeats; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.classList.add('empty');

        if (manualStatus[i] === 0) {
            seat.classList.remove('empty');
            seat.classList.add('disabled');
        }

        seat.addEventListener('click', () => toggleSeatStatus(seat));
        seatContainer.appendChild(seat);
    }
}

function toggleViewMode(isTeacherView) {
    document.querySelector('main').setAttribute('data-view', isTeacherView ? 'teacher' : 'student');
    
    const seatContainer = document.getElementById('seatContainer');
    const seats = Array.from(seatContainer.children);
    
    seats.reverse();
    seats.forEach(seat => seatContainer.appendChild(seat));
    manualStatus.reverse();
}

window.onload = function () {
    setTimeout(() => {
        document.body.classList.remove('preload');
    }, 100);

    const data = JSON.parse(localStorage.getItem('classLayoutData'));

    if (data) {
        document.getElementById('studentCount').value = data.studentCount;
        document.getElementById('rowCount').value = data.rowCount;
        document.getElementById('colCount').value = data.colCount;
        document.getElementById('pairing').checked = data.pairing;

        const isTeacherView = data.viewMode !== undefined ? data.viewMode : true;
        document.getElementById('viewMode').checked = isTeacherView;
        document.querySelector('main').setAttribute('data-view', isTeacherView ? 'teacher' : 'student');
        document.getElementById('autoDownloadHwp').checked = data.autoDownloadHwp || false;

        document.getElementById('excludeStudents').value = data.excludeStudents;
        manualStatus = data.manualStatus || [];

        if (data.seatContainerHTML) {
            const seatContainer = document.getElementById('seatContainer');
            const cols = data.colCount || 5;
            seatContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            seatContainer.innerHTML = data.seatContainerHTML;

            const seats = seatContainer.getElementsByClassName('seat');
            for (let i = 0; i < seats.length; i++) {
                const currentSeat = seats[i];
                currentSeat.addEventListener('click', () => toggleSeatStatus(currentSeat));
            }
        } else {
            initializeSeats();
        }
    } else {
        document.getElementById('viewMode').checked = true;
        document.querySelector('main').setAttribute('data-view', 'teacher');
        initializeSeats();
    }

    const inputs =['studentCount', 'rowCount', 'colCount', 'pairing', 'excludeStudents', 'viewMode', 'autoDownloadHwp'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            if (id === 'rowCount' || id === 'colCount') {
                manualStatus = [];
                initializeSeats();
            }
            if (id === 'viewMode') {
                toggleViewMode(e.target.checked);
            }
            saveData();
        });
    });
}

function toggleSeatStatus(seat) {
    const index = Array.from(seat.parentNode.children).indexOf(seat);

    if (seat.classList.contains('disabled')) {
        seat.classList.remove('disabled');
        manualStatus[index] = 1;

        if (seat.dataset.prevHtml) {
            seat.innerHTML = seat.dataset.prevHtml;
            seat.className = seat.dataset.prevClass;
            delete seat.dataset.prevHtml;
            delete seat.dataset.prevClass;
        } else {
            seat.classList.add('empty');
        }

    } else {
        manualStatus[index] = 0;

        if (!seat.classList.contains('empty')) {
            seat.dataset.prevHtml = seat.innerHTML;
            seat.dataset.prevClass = seat.className;
        }

        seat.className = 'seat disabled';
        seat.textContent = '';
    }
    saveData();
}

function deleteData() {
    if (confirm('설정을 초기화하시겠습니까?')) {
        localStorage.removeItem('classLayoutData');
        location.reload();
    }
}

function padNumber(num) {
    return num.toString().padStart(2, '0');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const randomBuffer = new Uint32Array(1);
        crypto.getRandomValues(randomBuffer);
        const j = randomBuffer[0] % (i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function generateSeats() {

    const nav = document.querySelector('nav');
    if (nav.classList.contains('active')) {
        toggleSettings();
    }

    const studentCount = parseInt(document.getElementById('studentCount').value);
    const rowCount = parseInt(document.getElementById('rowCount').value) || 4;
    const colCount = parseInt(document.getElementById('colCount').value) || 5;

    if (!studentCount || studentCount <= 0) {
        alert('학생 수를 입력해주세요.');
        return;
    }

    const pairing = document.getElementById('pairing').checked;
    const isTeacherView = document.getElementById('viewMode').checked;

    const excludeVal = document.getElementById('excludeStudents').value;
    const excludeStudents = excludeVal ? excludeVal.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : [];

    const seatContainer = document.getElementById('seatContainer');
    seatContainer.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;

    let seats = Array.from(seatContainer.children);
    if (seats.length !== rowCount * colCount) {
        initializeSeats();
        seats = Array.from(seatContainer.children);
    }

    let studentNumbers = [];
    for (let i = 1; i <= studentCount; i++) {
        if (!excludeStudents.includes(i)) studentNumbers.push(i);
    }

    const availableSeatIndices = [];
    seats.forEach((seat, idx) => {
        delete seat.dataset.prevHtml;
        delete seat.dataset.prevClass;

        if (manualStatus[idx] === 0) {
            seat.className = 'seat disabled';
            seat.textContent = '';
        } else {
            seat.className = 'seat empty';
            seat.textContent = '';
            availableSeatIndices.push(idx);
        }
    });

    if (isTeacherView) { availableSeatIndices.reverse(); }


    const neededSeats = pairing ? Math.ceil(studentNumbers.length / 2) : studentNumbers.length;
    if (availableSeatIndices.length < neededSeats) {
        alert(`자리가 부족합니다! (학생: ${studentNumbers.length}명, 가능좌석: ${availableSeatIndices.length}개)`);
        return;
    }

    const allStudentsForAnim = Array.from({ length: studentCount }, (_, i) => i + 1);
    const seatsToAnimate = availableSeatIndices.map(i => seats[i]);

    const totalSpins = 10;
    const startSpeed = 50;
    const endSpeed = 200;
    const speedIncrement = (endSpeed - startSpeed) / totalSpins;

    for (let spin = 0; spin < totalSpins; spin++) {
        const shuffledAnim = shuffle([...allStudentsForAnim]);
        seatsToAnimate.forEach((seat, i) => {
            if (i < neededSeats) {
                seat.classList.add('rolling');

                if (pairing) {
                    const idx1 = (i * 2) % shuffledAnim.length;
                    const idx2 = (i * 2 + 1) % shuffledAnim.length;

                    seat.innerHTML = `
                                <span style="font-size: 1.2rem">${padNumber(shuffledAnim[idx1])}</span>
                                <span style="margin:0 6px; opacity:0.3; font-weight:300;">|</span>
                                <span style="font-size: 1.2rem">${padNumber(shuffledAnim[idx2])}</span>
                            `;
                } else {
                    seat.textContent = padNumber(shuffledAnim[i % shuffledAnim.length]);
                }
            }
        });
        await sleep(startSpeed + (spin * speedIncrement));
    }

    const shuffledStudents = shuffle([...studentNumbers]);
    let studentIndex = 0;

    availableSeatIndices.forEach(idx => {
        seats[idx].className = 'seat empty';
        seats[idx].textContent = '';
    });

    for (let i = 0; i < availableSeatIndices.length; i++) {
        const seat = seats[availableSeatIndices[i]];

        if (studentIndex < shuffledStudents.length) {
            seat.classList.remove('empty');
            seat.classList.add('confirmed');

            if (pairing) {
                if (studentIndex + 1 < shuffledStudents.length) {
                    seat.classList.add('paired');
                    seat.innerHTML = `
                                <span>${padNumber(shuffledStudents[studentIndex])}</span>
                                <span style="margin:0 6px; opacity:0.3; font-weight:300;">|</span>
                                <span>${padNumber(shuffledStudents[studentIndex + 1])}</span>
                            `;
                    studentIndex += 2;
                } else {
                    seat.textContent = padNumber(shuffledStudents[studentIndex]);
                    studentIndex += 1;
                }
            } else {
                seat.textContent = padNumber(shuffledStudents[studentIndex]);
                studentIndex += 1;
            }
        }
    }
    saveData();

    if (document.getElementById('autoDownloadHwp').checked) {
        setTimeout(() => {
            generateHWP();
        }, 700);
    }
}

function toggleSettings() {
    const nav = document.querySelector('nav');
    const overlay = document.getElementById('overlay');

    nav.classList.toggle('active');
    overlay.classList.toggle('active');
}

function generateHWP() {
    const colCount = parseInt(document.getElementById('colCount').value) || 5;
    const rowCount = parseInt(document.getElementById('rowCount').value) || 4;
    const isTeacherView = document.getElementById('viewMode').checked;
    
    const seatElements = Array.from(document.getElementById('seatContainer').children);

    const blackboardHtml = `
        <tr>
            <td colspan="${colCount}" style="height: 50px; text-align: center; font-weight: bold; font-size: 16px; border: 1px solid #000000; background-color: #f8f9fa;">
                교탁 (칠판)
            </td>
        </tr>
    `;

    let tableRowsHtml = '';

    if (!isTeacherView) tableRowsHtml += blackboardHtml;

    for (let i = 0; i < rowCount; i++) {
        tableRowsHtml += '<tr>';
        for (let j = 0; j < colCount; j++) {
            const index = i * colCount + j;
            const uiSeat = seatElements[index];

            let cellContent = '';
            if (uiSeat && uiSeat.classList.contains('disabled')) {
                cellContent = '<div style="text-align:center; color:#cccccc; font-size:20px; line-height:120px;">✕</div>';
            } else if (uiSeat) {
                const seatNum = uiSeat.textContent.replace(/\s+/g, ' ').trim();
                cellContent = `
                    <div style="height: 30px; line-height: 30px; border-bottom: 1px solid #e0e0e0; font-weight: bold; font-size: 14px; text-align: center;">${seatNum}</div>
                    <div style="height: 60px;"></div> <!-- 이름 작성용 넉넉한 빈 공간 -->
                `;
            }

            tableRowsHtml += `
                <td style="width: ${100/colCount}%; height: 120px; border: 1px solid #000000; vertical-align: top; padding: 0;">
                    ${cellContent}
                </td>
            `;
        }
        tableRowsHtml += '</tr>';
    }

    if (isTeacherView) tableRowsHtml += blackboardHtml;

    const htmlString = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <title>학급 자리 배치표</title>
        </head>
        <body style="font-family: 'Malgun Gothic', '맑은 고딕', 'Dotum', sans-serif;">
            <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px;">학급 자리 배치표</h2>
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;" border="1" cellspacing="0" cellpadding="0">
                ${tableRowsHtml}
            </table>
        </body>
        </html>
    `;

    const BOM = '\uFEFF';
    
    const blob = new Blob([BOM + htmlString], { type: 'application/x-hwp;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `자리배치표_${new Date().toLocaleDateString().replace(/\. /g, '').replace(/\./g, '')}.hwp`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}