<?php

return [
    // Proxies o balanceadores delante de nginx (IP o rangos, separados por coma). Sin esto, los límites por IP ven solo la del proxy.
    'proxies' => env('TRUSTED_PROXIES'),
];
