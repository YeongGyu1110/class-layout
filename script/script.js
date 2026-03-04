let manualStatus = [];

function saveData() {
    const data = {
        studentCount: document.getElementById('studentCount').value,
        rowCount: document.getElementById('rowCount').value,
        colCount: document.getElementById('colCount').value,
        pairing: document.getElementById('pairing').checked,
        excludeStudents: document.getElementById('excludeStudents').value,
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

        seat.addEventListener('click', () => toggleSeatStatus(seat, i));
        seatContainer.appendChild(seat);
    }
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
        document.getElementById('excludeStudents').value = data.excludeStudents;
        manualStatus = data.manualStatus || [];

        if (data.seatContainerHTML) {
            const seatContainer = document.getElementById('seatContainer');
            const cols = data.colCount || 5;
            seatContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            seatContainer.innerHTML = data.seatContainerHTML;

            const seats = seatContainer.getElementsByClassName('seat');
            for (let i = 0; i < seats.length; i++) {
                seats[i].addEventListener('click', () => toggleSeatStatus(seats[i], i));
            }
        } else {
            initializeSeats();
        }
    } else {
        initializeSeats();
    }

    const inputs = ['studentCount', 'rowCount', 'colCount', 'pairing', 'excludeStudents'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            if (id === 'rowCount' || id === 'colCount') {
                manualStatus = [];
                initializeSeats();
            }
            saveData();
        });
    });
}

function toggleSeatStatus(seat, index) {
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
    const studentCount = parseInt(document.getElementById('studentCount').value);
    const rowCount = parseInt(document.getElementById('rowCount').value) || 4;
    const colCount = parseInt(document.getElementById('colCount').value) || 5;

    if (!studentCount || studentCount <= 0) {
        alert('학생 수를 입력해주세요.');
        return;
    }

    const pairing = document.getElementById('pairing').checked;
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
}