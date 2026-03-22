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
        autoDownloadPdf: document.getElementById('autoDownloadPdf').checked,
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
        document.getElementById('autoDownloadPdf').checked = data.autoDownloadPdf || false;

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

    const inputs =['studentCount', 'rowCount', 'colCount', 'pairing', 'excludeStudents', 'viewMode', 'autoDownloadPdf'];
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

    if (document.getElementById('autoDownloadPdf').checked) {
        setTimeout(() => {
            generatePDF();
        }, 700);
    }
}

function toggleSettings() {
    const nav = document.querySelector('nav');
    const overlay = document.getElementById('overlay');

    nav.classList.toggle('active');
    overlay.classList.toggle('active');
}

function generatePDF() {
    const colCount = parseInt(document.getElementById('colCount').value) || 5;
    const isTeacherView = document.getElementById('viewMode').checked;

    // 1. PDF 컨테이너
    const element = document.createElement('div');
    element.style.width = '190mm'; 
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#000000';
    element.style.boxSizing = 'border-box';
    element.style.fontFamily = 'sans-serif';

    // 타이틀
    const title = document.createElement('h2');
    title.textContent = '학급 자리 배치표';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.fontSize = '24px';
    element.appendChild(title);

    // 칠판 요소
    const blackboard = document.createElement('div');
    blackboard.textContent = '칠판';
    blackboard.style.width = '100%';
    blackboard.style.padding = '10px 0';
    blackboard.style.textAlign = 'center';
    blackboard.style.border = '1px solid #000';
    blackboard.style.fontWeight = 'bold';
    blackboard.style.fontSize = '16px';
    blackboard.style.boxSizing = 'border-box';

    // 자리표 그리드
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;
    grid.style.borderTop = '1px solid #000';
    grid.style.borderLeft = '1px solid #000';
    grid.style.width = '100%';
    grid.style.boxSizing = 'border-box';


    const seatElements = Array.from(document.getElementById('seatContainer').children);

    seatElements.forEach(uiSeat => {
        const cell = document.createElement('div');
        cell.style.borderBottom = '1px solid #000';
        cell.style.borderRight = '1px solid #000';
        cell.style.height = '80px';
        cell.style.display = 'flex';
        cell.style.flexDirection = 'column';
        cell.style.boxSizing = 'border-box';

        if (uiSeat.classList.contains('disabled')) {
            cell.style.justifyContent = 'center';
            cell.style.alignItems = 'center';
            cell.innerHTML = '<span style="color: #ccc; font-size: 20px;">✕</span>';
        } else {
            const topDiv = document.createElement('div');
            topDiv.style.height = '30px';
            topDiv.style.display = 'flex';
            topDiv.style.justifyContent = 'center';
            topDiv.style.alignItems = 'center';
            topDiv.style.fontSize = '16px';
            topDiv.style.fontWeight = 'bold';
            
            topDiv.textContent = uiSeat.textContent.replace(/\s+/g, ' ').trim();

            const bottomDiv = document.createElement('div');
            bottomDiv.style.flex = '1';
            // bottomDiv.style.borderTop = '1px solid #eee'; 
            
            cell.appendChild(topDiv);
            cell.appendChild(bottomDiv);
        }
        grid.appendChild(cell);
    });

    if (isTeacherView) {
        grid.style.marginBottom = '20px';
        element.appendChild(grid);
        element.appendChild(blackboard);
    } else {
        blackboard.style.marginBottom = '20px';
        element.appendChild(blackboard);
        element.appendChild(grid);
    }

    const opt = {
        margin: 10,
        filename: `자리배치표_${new Date().toLocaleDateString().replace(/\. /g, '').replace(/\./g, '')}.pdf`,
        image: {
            type: 'jpeg',
            quality: 1.0
        },
        html2canvas: {
            scale: 2
        }, 
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    html2pdf().set(opt).from(element).save();
}