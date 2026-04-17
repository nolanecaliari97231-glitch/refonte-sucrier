<?php
session_start();
require __DIR__ . '/../includes/bootstrap.php';

if (empty($_SESSION['is_admin'])) {
    header('Location: login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: dashboard.php');
    exit;
}

$newData = $contenu;
$uploadDirFs = __DIR__ . '/../images/uploads';
$uploadDirWeb = 'images/uploads';
$contentPath = __DIR__ . '/../data/contenu.json';
$backupPath = __DIR__ . '/../data/contenu.backup.json';
$catalogueDefaultPage = [
    'title' => 'Catalogue',
    'intro' => 'Albums jeunesse et collections des Editions du Sucrier',
];
$catalogueDefaultBooks = [
    [
        'id' => 'nikou-champion',
        'collection' => 'Nikou',
        'title' => 'Nikou champion',
        'authors' => 'L. Ramassamy · W. Deroche',
        'price' => '12,00 €',
        'image' => 'images/nikou-champion.png',
        'preview_images' => 'images/nikou-champion.png,images/bebe-nikou-dit-non.png,images/sous-le-quenettier-mamy-ayuda-t2.png',
    ],
    [
        'id' => 'circuit-ferme',
        'collection' => 'Album jeunesse',
        'title' => 'Circuit ferme',
        'authors' => 'J.-F. Silva · O. J. F. Junior',
        'price' => '14,00 €',
        'image' => 'images/circuit-ferme.png',
        'preview_images' => 'images/circuit-ferme.png,images/salon-livre-martinique.png,images/tice-et-metice.png',
    ],
    [
        'id' => 'exocette',
        'collection' => 'Les histoires du Sucrier',
        'title' => 'Exocette',
        'authors' => 'Renata · W. Deroche',
        'price' => '15,00 €',
        'image' => 'images/exocette.png',
        'preview_images' => 'images/exocette.png,images/nikou-musicien.png,images/circuit-ferme.png',
    ],
    [
        'id' => 'tice-et-metice',
        'collection' => 'Plumes aventureuses',
        'title' => 'Tice et Metice',
        'authors' => 'K. Petevi · Gecko Dalch',
        'price' => '13,00 €',
        'image' => 'images/tice-et-metice.png',
        'preview_images' => 'images/tice-et-metice.png,images/exocette.png,images/nikou-champion.png',
    ],
];

if (!is_dir($uploadDirFs)) {
    mkdir($uploadDirFs, 0775, true);
}

function makeBookId(string $title, int $index): string
{
    $slug = strtolower(trim($title));
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug ?? '') ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') {
        $slug = 'livre-' . ($index + 1);
    }
    return $slug;
}

/**
 * Upload one image and return web path, or null.
 */
function uploadImageFile(string $fieldName, string $uploadDirFs, string $uploadDirWeb): ?string
{
    if (!isset($_FILES[$fieldName])) {
        return null;
    }

    $file = $_FILES[$fieldName];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return null;
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        return null;
    }

    $allowedMimeToExt = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    $mime = mime_content_type($tmpPath) ?: '';
    if (!isset($allowedMimeToExt[$mime])) {
        return null;
    }

    $ext = $allowedMimeToExt[$mime];
    $safeName = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    $targetFs = $uploadDirFs . '/' . $safeName;

    if (!move_uploaded_file($tmpPath, $targetFs)) {
        return null;
    }

    return $uploadDirWeb . '/' . $safeName;
}

/**
 * Upload multiple preview images and return web paths.
 *
 * @return string[]
 */
function uploadPreviewFiles(string $fieldName, string $uploadDirFs, string $uploadDirWeb): array
{
    if (
        !isset($_FILES[$fieldName]['name']) ||
        !is_array($_FILES[$fieldName]['name'])
    ) {
        return [];
    }

    $uploaded = [];
    $maxFiles = min(3, count($_FILES[$fieldName]['name']));
    for ($j = 0; $j < $maxFiles; $j++) {
        $error = $_FILES[$fieldName]['error'][$j] ?? UPLOAD_ERR_NO_FILE;
        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        $singleField = $fieldName . '_single_' . $j;
        $_FILES[$singleField] = [
            'name' => $_FILES[$fieldName]['name'][$j] ?? '',
            'type' => $_FILES[$fieldName]['type'][$j] ?? '',
            'tmp_name' => $_FILES[$fieldName]['tmp_name'][$j] ?? '',
            'error' => $error,
            'size' => $_FILES[$fieldName]['size'][$j] ?? 0,
        ];

        $path = uploadImageFile($singleField, $uploadDirFs, $uploadDirWeb);
        unset($_FILES[$singleField]);
        if ($path !== null) {
            $uploaded[] = $path;
        }
    }

    return $uploaded;
}

$action = (string) ($_POST['action'] ?? '');
if ($action === 'restore_backup') {
    if (is_file($backupPath)) {
        copy($backupPath, $contentPath);
        header('Location: dashboard.php?saved=1&action=restore_backup');
        exit;
    }
    header('Location: dashboard.php?saved=1');
    exit;
}

if (is_file($contentPath)) {
    copy($contentPath, $backupPath);
}

$newData['home_page']['hero_tag'] = trim((string) ($_POST['home_hero_tag'] ?? ''));
$newData['home_page']['hero_title'] = trim((string) ($_POST['home_hero_title'] ?? ''));
$newData['home_page']['hero_intro'] = trim((string) ($_POST['home_hero_intro'] ?? ''));
$newData['home_page']['cta_primary_text'] = trim((string) ($_POST['home_cta_primary_text'] ?? ''));
$newData['home_page']['cta_secondary_text'] = trim((string) ($_POST['home_cta_secondary_text'] ?? ''));

$newData['about_page']['title'] = trim((string) ($_POST['about_title'] ?? ''));
$newData['about_page']['intro'] = trim((string) ($_POST['about_intro'] ?? ''));
$newData['about_page']['paragraphe_1'] = trim((string) ($_POST['about_p1'] ?? ''));
$newData['about_page']['paragraphe_2'] = trim((string) ($_POST['about_p2'] ?? ''));

if ($action === 'reset_catalogue') {
    $newData['catalogue_page'] = $catalogueDefaultPage;
    $newData['catalogue_books'] = $catalogueDefaultBooks;
} else {
    $newData['catalogue_page']['title'] = trim((string) ($_POST['catalogue_title'] ?? ''));
    $newData['catalogue_page']['intro'] = trim((string) ($_POST['catalogue_intro'] ?? ''));

    $bookCount = max(0, (int) ($_POST['book_count'] ?? 0));
    $booksOut = [];
    for ($i = 0; $i < $bookCount; $i++) {
        if (isset($_POST['book_' . $i . '_remove_book'])) {
            continue;
        }

        $book = [];
        $book['collection'] = trim((string) ($_POST['book_' . $i . '_collection'] ?? ''));
        $book['title'] = trim((string) ($_POST['book_' . $i . '_title'] ?? ''));
        $book['authors'] = trim((string) ($_POST['book_' . $i . '_authors'] ?? ''));
        $book['price'] = trim((string) ($_POST['book_' . $i . '_price'] ?? ''));
        $book['image'] = trim((string) ($_POST['book_' . $i . '_image'] ?? ''));
        $book['preview_images'] = trim((string) ($_POST['book_' . $i . '_preview_images'] ?? ''));
        $book['id'] = trim((string) (($newData['catalogue_books'][$i]['id'] ?? makeBookId($book['title'], $i))));

        if (isset($_POST['book_' . $i . '_remove_image'])) {
            $book['image'] = '';
        }
        if (isset($_POST['book_' . $i . '_remove_previews'])) {
            $book['preview_images'] = '';
        }

        $uploadedMain = uploadImageFile('book_' . $i . '_image_file', $uploadDirFs, $uploadDirWeb);
        if ($uploadedMain !== null) {
            $book['image'] = $uploadedMain;
        }

        $uploadedPreviews = uploadPreviewFiles('book_' . $i . '_preview_files', $uploadDirFs, $uploadDirWeb);
        if (!empty($uploadedPreviews)) {
            $book['preview_images'] = implode(',', $uploadedPreviews);
        }

        $booksOut[] = $book;
    }

    if ($action === 'add_book') {
        $booksOut[] = [
            'id' => 'livre-' . (count($booksOut) + 1),
            'collection' => 'Nouvelle collection',
            'title' => 'Nouveau livre',
            'authors' => 'Auteur',
            'price' => '0,00 €',
            'image' => '',
            'preview_images' => '',
        ];
    }

    $newData['catalogue_books'] = $booksOut;
}

$newData['contact_page']['title'] = trim((string) ($_POST['contact_title'] ?? ''));
$newData['contact_page']['intro'] = trim((string) ($_POST['contact_intro'] ?? ''));
$newData['contact_page']['bloc_titre'] = trim((string) ($_POST['contact_bloc_titre'] ?? ''));
$newData['contact_page']['bloc_texte'] = trim((string) ($_POST['contact_bloc_texte'] ?? ''));
$newData['contact_page']['adresse_texte'] = trim((string) ($_POST['contact_adresse_texte'] ?? ''));
$newData['contact_page']['telephone'] = trim((string) ($_POST['contact_telephone'] ?? ''));

$newData['footer']['description'] = trim((string) ($_POST['footer_description'] ?? ''));
$newData['footer']['ville'] = trim((string) ($_POST['footer_ville'] ?? ''));
$newData['footer']['telephone'] = trim((string) ($_POST['footer_tel'] ?? ''));

$json = json_encode($newData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    header('Location: dashboard.php');
    exit;
}

file_put_contents($contentPath, $json . PHP_EOL);
if ($action !== '') {
    header('Location: dashboard.php?saved=1&action=' . urlencode($action));
    exit;
}
header('Location: dashboard.php?saved=1');
exit;
