
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