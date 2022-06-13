## Bardzo uproszczona symulacja przyspieszenia pojazdów

E - stacyjka pojazdu

Strzałka w górę - przyspieszenie
Strzałka w dół - mocniejsze hamowanie

Skrzynia manualna (W TRAKCIE BUDOWY, NIE DZIAŁA W PEŁNI POPRAWNIE) -> 
A - wyższy bieg
Z - niższy bieg

## W trakcie tworzenia:
- W przypadku postoju i pierwszego biegu naciśnięcie 'hamucla', a następnie 'przyspieszenia'
spowoduje uruchomienie procedury startowej (LaunchControl) w niektórych pojazdach co
przełoży się na nieco lepsze przyspieszenie dla pierwszego biegu czyli lepszy czas 0-100
- Usunięcie skutków ubocznych skrzyni manualnej
- Wykonanie dokładnego stopera przyspieszenia opartego na timestamp
- dodanie wyboru różnych pojazdów z listy
- ulepszenie wizualne liczników

##

źródła co do specyfikacji poszczególnych pojazdów:
https://www.carfolio.com/car-makes/ 
https://accelerationtimes.com/
https://www.automobile-catalog.com/browse.php
##

źródła obliczeń mocy, obciążeń, obrotów, itp.:
https://www.blocklayer.com/rpm-gear.aspx
https://nccastaff.bournemouth.ac.uk/jmacey/MastersProject/MSc12/Srisuchat/Thesis.pdf
https://sbel.wisc.edu/wp-content/uploads/sites/569/2018/05/Real-time-Vehicle-Simulation-for-Video-Games-Using-the-Bullet-Physics-Library.pdf
https://x-engineer.org/vehicle-acceleration-maximum-speed-modeling-simulation/
https://asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
##