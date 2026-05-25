<?php
// save.php
header('Content-Type: application/json');

// Načtení dat z požadavku
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data !== null) {
    // Uložení do souboru (JSON_PRETTY_PRINT pro hezké formátování)
    if (file_put_contents('data.json', json_encode($data, JSON_PRETTY_PRINT))) {
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Nelze zapsat do souboru. Zkontrolujte oprávnění."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Žádná data"]);
}
?>