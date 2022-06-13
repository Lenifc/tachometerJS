
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
// -62 stopnie odpowiadaja za ustawienie wskazówki na 0 przy zegarach
tachoHand.style.transform = `rotate(${tachoDegree}deg)`
speedoHand.style.transform = `rotate(${speedoDegree}deg)`