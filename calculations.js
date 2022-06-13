
// elementy HTML
const showTacho = document.querySelector('.digital-tacho')
const showSpeed = document.querySelector('.digital-speed')
const tachoHand = document.querySelector(".tacho-hand")
const speedoHand = document.querySelector(".speedo-hand")
const gear = document.querySelector('.gear')
const showTimer = document.querySelector('.timer')
const log = document.querySelector('.logs') // tylko czasowo do debugu nacisnietych klawiszy
//

const dt = 1000 / 60 // odpowiada za 60fps czyli domyslne odswiezanie animacji
let tachoDegree = -62,
    speedoDegree = -62 

// Ustawienie wskaźników po załadowaniu strony;
// -62 stopnie odpowiadaja za ustawienie wskaźnika na 0 przy zegarach
tachoHand.style.transform = `rotate(${tachoDegree}deg)`
speedoHand.style.transform = `rotate(${speedoDegree}deg)`


let controller = []
let pressedKeys = [] // tylko do debugu klawiszy
let rev = undefined
let calm = undefined
let isOn = false
let newRPM = 0
let rpm = 0
let rph = 0
let selectedGear = 0
let speed = 0
let accelerate = 0

// poniższe zakomentowane zmienne przydadzą sie później
// let activeLC = false // LC - LaunchControl
// let LC_RPM = 3000
// let clutch = true
// let changeToNeutral = undefined


//stopery, mierzenie przyspieszenia pojazdu
let counterStarted = false
let timer
let count_0_100 = 0,
    count_0_150 = 0,
    count_0_200 = 0,
    count_0_250 = 0,
    count_0_300 = 0,
    count_100_200 = 0,
    count_200_300 = 0


    // ogólna klasa dla wprowadzanych pojazdów, uwzględnia wszystkie potrzebne parametry do obliczenia przyspieszenia
class Vehicle { //{1:xx,2:xx..,finalDrive:yy},[225,40,18], [750, 1000, 2000, 3000, 3500, 4500, 5500, 6500, 8000]
    constructor(name, type, hp, torque, topSpeed, weight, maxRPM, maxGear, gearRatios, tireSize, simplifiedTorqueCurve, accelerationMultiplier, launchControlAvailable) {
        this.brand = name
        this.type = type
        this.engine.maxHP = hp
        this.engine.maxTorque = torque
        this.availableLC = launchControlAvailable
        this.topSpeed = topSpeed
        this.mass = weight
        this.engine.maxRPM = maxRPM
        this.maxGear = maxGear
        this.transmission.gears = gearRatios,
            this.wheel.tireSize = tireSize,
            this.engine.engineSpeed = {
                // w przypadku elektryka jego moc jest stala oraz nie posiada skrzyni, wiec pozostale wartosci sa niepotrzebne - zabezpieczono wyrzucenie błędów poprzez '|| 0'
                750: simplifiedTorqueCurve[0],
                1000: simplifiedTorqueCurve?.[1] || 0,
                2000: simplifiedTorqueCurve?.[2] || 0,
                3000: simplifiedTorqueCurve?.[3] || 0,
                3500: simplifiedTorqueCurve?.[4] || 0,
                4500: simplifiedTorqueCurve?.[5] || 0,
                5500: simplifiedTorqueCurve?.[6] || 0,
                6500: simplifiedTorqueCurve?.[7] || 0,
                8000: simplifiedTorqueCurve?.[8] || 0,
            },
            this.accelerationMultiplier = accelerationMultiplier || 1
    }
    brand = this.brand
    engine = {
        maxTorque: this.maxTorque,
        maxHP: this.maxHP,
        minRPM: 750,
        maxRPM: this.maxRPM,
        // engineSpeed - tablica momentu obrotowego dla zakresów obrotów silnika
        engineSpeed: this.engineSpeed
    }
    transmission = {
        getTransmissionRatio() {
            return {
                ...this.gears,
                0: 15,
                efficient: 0.85
            }
        }
    }
    wheel = {
        getWheelRadius() {
            return ((this.tireSize[0] * 10 ** -3) / 2) + 0.0885
        },
        getWheelDiameter() {
            return (this.tireSize[0] * 2 * this.tireSize[1] / 100) + (this.tireSize[2] * 25.4)
        }
    }
    // poniżej wartości stałe
    // masa pojazdu uwzględnia także kierowcę ~80kg
    aeroDrag = 0.34
    gravity = 9.81 // [m/s2]
    frontalArea = 1.99 // [m2]
    airDensity = 1.202 //[kg/m3]
    roadDrag = 0.011 // opór drogi [-]
    circuit = Math.PI * (10 ** -6)
}

// wprowadzenie kilku różnych pojazdów z innymi parametrami oraz dostosowanie ich, aby uzyskać przyspieszenia przybliżone do realnych
let vehicle_tier1 = new Vehicle('2017 Ford Fiesta 1.0 ECOBOOST', 'petrol', 140, 180, 202, 1240, 6400, 5, { 1: 3.58, 2: 1.93, 3: 1.21, 4: 0.88, 5: 0.69, finalDrive: 3.61}, [195, 60, 15], [90, 120, 150, 170, 180, 145, 110], 1.30)
let vehicle_tier2 = new Vehicle('Passat CC V6', 'petrol', 300, 350, 260, 1700, 6900, 6, { 1: 3.95, 2: 2.30, 3: 1.55, 4: 1.16, 5: 0.86, 6: 0.69, finalDrive: 3.5}, [225, 40, 18], [200, 230, 260, 320, 350, 350, 330, 300], 1.10)
// let vehicle_tier3 = new Vehicle('Tesla Model S P85', 'electric', 422, 601, 210, 2190, 10000, 1, { 1: 1, finalDrive: 1.25}, [225, 40, 18], [601], 1)
let vehicle_tier4 = new Vehicle('Audi R8 2008', 'petrol', 420, 430, 301, 1565, 7650, 6, { 1: 4.37, 2: 2.71, 3: 1.88, 4: 1.41, 5: 1.13, 6: 0.93, finalDrive: 3.46}, [295, 30, 20], [280, 306, 385, 420, 430, 430, 430, 400], 1.15)
let vehicle_tier5 = new Vehicle('Lamborghini Huracán LP-610', 'petrol', 601, 560, 325, 1520, 8300, 7, { 1: 3.13, 2: 2.08, 3: 1.58, 4: 1.24, 5: 0.98, 6: 0.79, 7: 0.68, finalDrive: 4.89}, [295, 30, 20], [240, 290, 380, 430, 460, 520, 560, 540, 500], 1.48)

// chwilowo brak wyboru pojazdu z listy, jest wybierany na sztywno z poziomu kodu
const car = vehicle_tier5



// nasłuchiwanie na wciśnięcie klawisza
window.addEventListener("keydown", onKeyPressed)
window.addEventListener('keydown', function (e) {
    controller = (controller || [])
    controller[e.code] = (e.type == "keydown")

    // TYLKO DO DEBUGU - dodane aby kontrolować stan klawiszy
    let li = pressedKeys[e.code]
    if (!li) {
        li = log.appendChild(document.createElement('li'));
        pressedKeys[e.code] = li;
    }
    li.classList.remove('key-up')
    li.innerText = `UP: ${e.code}`
    // TYLKO DO DEBUGU - dodane aby kontrolować stan klawiszy ///////////
})

// nasłuchiwanie na puszczenie klawisza
window.addEventListener('keyup', onKeyRelease)
window.addEventListener('keyup', function (e) {
    controller[e.code] = (e.type == "keydown")

    // TYLKO DO DEBUGU - dodane aby kontrolować stan klawiszy
    let li = pressedKeys[e.code]
    if (!li) {
        li = log.appendChild(document.createElement('li'));
    }
    li.classList.add('key-up')
    li.innerText = `DOWN: ${e.code}`
    // TYLKO DO DEBUGU - dodane aby kontrolować stan klawiszy ///////////
})



function onKeyPressed(e) {
    // IF częściowo zapobiega zwiększonemu przyspieszeniu podczas spamowania w klawisz, w któtkim odstępnie czasu
    if (e.code == 'ArrowUp' ||
        e.code == 'ArrowDown' ||
        e.code == 'KeyA' ||
        e.code == 'KeyZ' ||
        e.code == 'KeyE') {

        window.addEventListener('keyup', onKeyRelease)
        window.removeEventListener('keydown', onKeyPressed)


        // Symulacja stacyjki - Włącz/Wyłącz
        if (controller['KeyE']) {
            // Zabezpieczenie, które nie pozwala na wyłączenie, gdy nie jest w stanie spoczynku
            if (isOn && rpm < 800) {
                tachoHand.classList.add('engineOff') // animacja spadających obrotów
                setTimeout(() => tachoHand.classList.remove('engineOff'), 300)
                tachoDegree = -62 // -62 wskazówka leży na 0
                isOn = !isOn
                // oczywiście uruchomić można jedynie, gdy jest wyłączony
            } else if (rpm == 0) {
                tachoDegree = -47 // -47 wskazówka ma około 700rpm
                tachoHand.classList.add('startup') // animacja z 'przygazówką' po uruchomieniu
                setTimeout(() => tachoHand.classList.remove('startup'), 1000)
                isOn = !isOn
            } else return

            calcAndShowRevs(tachoDegree)
        }


        // Przyspieszanie
        if (controller['ArrowUp'] && isOn) {
            if (!counterStarted) timer = setInterval(() => timerFunc(), 100)
            accelerateFunc()
        }

        // Hamowanie
        if (controller['ArrowDown'] && isOn && selectedGear > 0) brakeFunc()
    } else return
}


function onKeyRelease(e) {
    if (e.code == 'ArrowUp' ||
        e.code == 'ArrowDown' ||
        e.code == 'KeyA' ||
        e.code == 'KeyZ' ||
        e.code == 'KeyE') {

        window.addEventListener('keydown', onKeyPressed)
        window.removeEventListener('keyup', onKeyRelease)

        
        // w przypadku puszczenia 'gazu' pojazd zaczyna zwalniac
        if (!controller['ArrowUp']) {
            cancelAnimationFrame(rev)
            brakeFunc()
            tachoHand.classList.remove('revLimiter')
        }
        // w przypadku, gdy 'gaz' jest nadal wciśnięty pojazd nie przestanie przyspieszać
        // np. w przypadku ręcznej zmiany biegów klawiszami A/Z
        if (controller['ArrowUp']) cancelAnimationFrame(calm)


        // Zmiana na wyższy bieg
        if (e.code == 'KeyA') {
            tachoDegree = (changeGear('1').newRPM / 44) - 62
        }

        // Zmiana na niższy bieg
        if (e.code == 'KeyZ') {
            // blokada redukcji biegow dla zbyt wysokich obrotow
            tachoDegree = changeGear('-1').newRPM > car.maxRPM-100 ? (changeGear('1').newRPM / 44 - 62) : (newRPM / 44 - 62)
        }
    } else return

}


// Przeliczenia oporów, mocy
function getTransmissionTorque(engineTorque, gearRatio) {
    return engineTorque * gearRatio * car.transmission.getTransmissionRatio().finalDrive * car.transmission.getTransmissionRatio().efficient
}
function getWheelForce(transmissionTorque) {
    return transmissionTorque / car.wheel.getWheelRadius()
}
function getForceDrag(speed) {
    return car.frontalArea * speed * Math.abs(speed)
}
function getForceRolling(speed) {
    return speed * car.roadDrag
}
function combineAllForces(forceDrag, forceRolling, ForceWheel) {
    return forceDrag + forceRolling - ForceWheel
}
function getAccelerate(allForces) {
    return accelerate + (dt * (allForces / car.mass))
}



function calcAcceleration(currRPM) {
    // przeliczenie mocy pojazdu na STOPNIE - o ile ma się poruszać wskaźnik obrotów 
    if (currRPM < 1000) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[750], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 1000 && currRPM < 2000) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[1000], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 2000 && currRPM < 3000) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[2000], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 3000 && currRPM < 3500) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[3000], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 3500 && currRPM < 4500) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[3500], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 4500 && currRPM < 5500) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[4500], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 5500 && currRPM < 6500) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[5500], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 6500 && currRPM < 7900) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[6500], car.transmission.getTransmissionRatio()[selectedGear])
    if (currRPM >= 7900) currentTransmissionTorque = getTransmissionTorque(car.engine.engineSpeed[8000], car.transmission.getTransmissionRatio()[selectedGear])

    // zastosowany mnożnik przyspieszenia dla pojazdów oraz blokada, aby pojazd nie zaczął przyspieszać za wolno
    accelerate = car.accelerationMultiplier * getAccelerate(Math.abs(combineAllForces(getForceDrag(speed) / 1000, getForceRolling(speed) * 100, getWheelForce(currentTransmissionTorque) / 10))) / 44
    accelerate = accelerate <= 0.04 && car.type != 'electric' ? 0.04 : accelerate

    // polepszenie przyspieszenia w przypadku niskich prędkości
    if (speed > 0 && speed <= 100 && car.type == 'electric') return accelerate * 2
    if (speed > 0 && speed <= 60 && selectedGear == 1) return accelerate * 1.55

    // spowolnienie przyspieszenia, aby zachować większy realizm
    else if (speed > 220) return accelerate / 2.77
    else if (speed > 200 || (selectedGear >= 3 && speed < 70) || (selectedGear >= 4 && speed < 100) || (selectedGear >= 5 && speed < 120)) return accelerate / 2.3
    else if (speed > 180) return accelerate / 1.9
    else if (speed > 160) return accelerate / 1.7
    else if (speed > 140) return accelerate / 1.5
    else if (speed > 120) return accelerate / 1.3
    else if (speed > 100) return accelerate / 1.1
    else return accelerate
}

function accelerateFunc() {
    if (speed >= car.topSpeed) tachoDegree = tachoDegree
    else if (tachoDegree <= ((car.engine.maxRPM / 44) - 62)) {
        if (controller['ArrowUp']) {
            tachoDegree += calcAcceleration(rpm)
            calcAndShowRevs(tachoDegree)
            calcandShowSpeed()
        }
    } else {
        // w przypadku osiągnięcia limitera zostanie nałożona animacja
        if ((selectedGear == 0 && rpm >= car.engine.maxRPM - 100) || (selectedGear == car.maxGear && speed >= car.topSpeed - 1)) tachoHand.classList.add('revLimiter')
        // po poprawieniu działania manualnej przekładni dodać wybór między całkowitym automatem, a manualem
        // póki co jest opcja hybrydowa z przewagą automatu
        else tachoDegree = (changeGear('1').newRPM / 44) - 62 // AUTOMAT
    }

    rev = window.requestAnimationFrame(accelerateFunc)
}

function brakeFunc() {
    if (tachoDegree >= -45 && !controller['ArrowUp']) {
        //na nizszych obrotach wskazowka 'uspokajaja sie' wolniej
        tachoDegree += tachoDegree < 5 ? -(0.07 * (controller['ArrowDown'] ? 3 : 1)) : -0.15 * (controller['ArrowDown'] ? 2 : 1) //na nizszych obrotach wskazowka 'uspokajaja sie' wolniej
        calcAndShowRevs(tachoDegree)
        calcandShowSpeed()
        reduceGearOnBrake()
    } else return

    calm = requestAnimationFrame(brakeFunc)
    tachoHand.classList.remove('revLimiter')
}

function reduceGearOnBrake() {
    // automatyczna redukcja biegu na niższy gdy obroty silnika robią się zbyt niskie
    if (rpm < 2500 && selectedGear > 1) tachoDegree = (changeGear('-1').newRPM / 44) - 62
}



function calcAndShowRevs(tachoDegree) {
    rpm = (tachoDegree + 62) * 44 // eksperymentalne przeliczenie stopni na obroty - 182stopnie-> 8000rpm
    rph = rpm * 60

    if (rpm <= 750 && isOn) {
        rpm = 750
        tachoDegree = -47
    }
    tachoHand.style.transform = `rotate(${tachoDegree}deg)`;

    let gearRatio = car.transmission.getTransmissionRatio()[selectedGear]

    // przeliczenie prędkości na podstawie wybranego biegu, wielkości kół i danych obrotów silnika
    speed = selectedGear != 0 ? (rph * car.wheel.getWheelDiameter() * car.circuit / (car.transmission.getTransmissionRatio().finalDrive * gearRatio)) : 0

    showSpeed.innerText = Math.round(speed)
    showTacho.innerText = 50 * Math.ceil(rpm / 50) // zaokragla wartosci do kazdej 50
}
function calcandShowSpeed(){
    let speedDegree 
        // wskaźniki inaczej reagują w zależności od prędkości - różne rozstawienia cyfr na blacie
        // skalibrowano ręcznie
    if (speed < 0) speedDegree = -62 
    if(speed < 100) speedDegree = (speed*1.15)-62
    if(speed >= 100 && speed < 200) speedDegree = (speed/1.1)-38
    if(speed >= 200 && speed < 300) speedDegree = (speed/1.25)-17
    if(speed >= 300) speedDegree = (speed/1.4)+10
    
    speedoHand.style.transform = `rotate(${speedDegree}deg)`;
}


function changeGear(change) {
    //
    // POPRAWIC ZMIANY BIEGU MIEDZY 'N', A 1 !! ABY PREDKOSC POWOLI SPADALA
    //

    // zabezpieczenie, aby nie wyjśc poza ilość dostępnych biegów
    if (selectedGear >= 0 && selectedGear <= car.maxGear - 1 && change == '1') selectedGear++
    if (selectedGear >= 1 && selectedGear <= car.maxGear && change == '-1') selectedGear--

    // przeliczenie jakie obroty powinny być po zmianie biegu
    newRPM = speed * (car.transmission.getTransmissionRatio().finalDrive * car.transmission.getTransmissionRatio()[selectedGear]) / (60 * car.wheel.getWheelDiameter() * car.circuit)
    gear.innerText = selectedGear == 0 ? 'N' : selectedGear

    if (selectedGear == 0) newRPM = rpm
    return {
        selectedGear,
        newRPM
    }
}


function timerFunc() {
return 0
}