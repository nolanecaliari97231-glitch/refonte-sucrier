<?php

declare(strict_types=1);

/**
 * Profils auteurs / héros éditables via back-office (fichiers JSON dédiés).
 */

function sucrier_cms_site_root(): string
{
    if (defined('SUCRIER_SITE_ROOT')) {
        return (string) SUCRIER_SITE_ROOT;
    }

    return dirname(__DIR__);
}

function sucrier_authors_json_path(): string
{
    return sucrier_cms_site_root() . '/data/authors.json';
}

function sucrier_heroes_json_path(): string
{
    return sucrier_cms_site_root() . '/data/heroes.json';
}

/** @return array<string, mixed> */
function sucrier_default_authors_data(): array
{
    return [
        'page' => [
            'kicker_fr' => 'Chapitre 2 · À propos',
            'kicker_en' => 'Chapter 2 · About',
            'title_fr' => 'Auteurs / Illustrateurs',
            'title_en' => 'Authors / Illustrators',
            'lead_fr' => 'Les talents qui portent la voix visuelle et narrative de nos collections jeunesse caribéennes.',
            'lead_en' => 'The talents behind the visual and narrative voice of our Caribbean children\'s collections.',
        ],
        'authors' => [
            [
                'slug' => 'renata',
                'photo' => 'images/portraits/renee-laure-zou.webp',
                'roles' => 'author illustrator',
                'name_fr' => 'Renée-Laure Zou (Renata)',
                'name_en' => 'Renée-Laure Zou (Renata)',
                'role_fr' => 'Auteure · illustratrice · éditrice jeunesse · Gérante',
                'role_en' => 'Author · illustrator · children\'s publisher · Managing director',
                'bio_fr' => 'Après avoir été enseignante à l\'Éducation nationale puis déléguée pédagogique pour Hachette Éducation, Renata entame son parcours d\'auteure-illustratrice en 2011 avec le manicou Nikou : les trois premiers albums sont publiés aux Éditions Orphie. En 2018, elle ouvre Les Éditions du Sucrier, entièrement tournées vers la littérature jeunesse, tout en poursuivant des collaborations externes en relecture, correction, traduction ou création littéraire.',
                'bio_en' => 'After teaching in France\'s national school system and working as a pedagogical delegate for Hachette Éducation, Renata began her journey as author-illustrator in 2011 with Nikou; the first three albums were released by Éditions Orphie. In 2018 she founded Les Éditions du Sucrier, wholly dedicated to books for young readers, while continuing freelance work in proofreading, editing, translation, and writing.',
            ],
            [
                'slug' => 'w-deroche',
                'photo' => 'images/portraits/wilfried-deroche-illustrateur.webp',
                'roles' => 'illustrator',
                'name_fr' => 'Wilfried Deroche',
                'name_en' => 'Wilfried Deroche',
                'role_fr' => 'Illustrateur',
                'role_en' => 'Illustrator',
                'bio_fr' => 'Wilfried Deroche donne son trait graphique aux collections Nikou et « Les histoires du Sucrier », dont Exocette, et assure la direction artistique de l\'univers visuel des ouvrages jeunesse du catalogue.',
                'bio_en' => 'Wilfried Deroche shapes the graphic world of the Nikou line and Les histoires du Sucrier titles such as Exocette, steering the visual art direction across the publisher\'s youth catalogue.',
            ],
            [
                'slug' => 'l-ramassamy',
                'photo' => 'images/portraits/author-leane-ramassamy.webp',
                'roles' => 'author',
                'name_fr' => 'Léanne Ramassamy',
                'name_en' => 'Léanne Ramassamy',
                'role_fr' => 'Auteure · championne de boxe',
                'role_en' => 'Author · boxing champion',
                'bio_fr' => 'Co-auteure de Nikou champion avec Wilfried Deroche, Léanne Ramassamy — également championne de boxe — entraîne les enfants vers le sport et la découverte de soi. Elle participe aux rencontres scolaires et à la médiation autour des albums jeunesse des Éditions du Sucrier.',
                'bio_en' => 'Co-author of Nikou champion with Wilfried Deroche, Léanne Ramassamy — also a boxing champion — encourages children to explore sport and self-confidence. She takes part in school visits and reading outreach for Les Éditions du Sucrier\'s youth titles.',
            ],
            [
                'slug' => 'k-petevi',
                'photo' => 'images/portraits/author-karine-petevi.webp',
                'roles' => 'author',
                'name_fr' => 'Karine Petevi',
                'name_en' => 'Karine Petevi',
                'role_fr' => 'Auteure · Tice et Métice',
                'role_en' => 'Author · Tice et Métice',
                'bio_fr' => 'Karine Petevi est de nationalité franco-chypriote. Enseignante et formatrice de français langue étrangère (FLE) à Chypre depuis une vingtaine d\'années, elle relie voyages, cultures et nature dans son album Tice et Métice, illustré par Gecko Dalch et publié aux Éditions du Sucrier (janvier 2024).',
                'bio_en' => 'Karine Petevi is French-Cypriot. For nearly twenty years she has taught and trained teachers in French as a foreign language (FLE) in Cyprus. She brings travel, cultures, and nature together in Tice et Métice, illustrated by Gecko Dalch and released by Les Éditions du Sucrier (January 2024).',
            ],
            [
                'slug' => 'rolyne-pam',
                'photo' => 'images/portraits/author-rolyne-pam.webp',
                'roles' => 'author',
                'name_fr' => 'Rolyne Pam',
                'name_en' => 'Rolyne Pam',
                'role_fr' => 'Auteure · Les comptines de Karambole',
                'role_en' => 'Author · Les comptines de Karambole',
                'bio_fr' => 'Avec Les comptines de Karambole, Rolyne Pam fait ses premiers pas d\'écrivaine. Elle s\'inspire de ses souvenirs d\'enfance en Guadeloupe et des histoires transmises par ses parents. Enseignante, elle utilise la littérature de jeunesse au quotidien pour faire décrire la Caraïbe aux plus jeunes.',
                'bio_en' => 'With Les comptines de Karambole, Rolyne Pam steps into publishing as a writer. She draws on childhood memories in Guadeloupe and family storytelling. As a teacher, she uses children\'s literature every day to invite students to talk about the Caribbean.',
            ],
            [
                'slug' => 'patrick-petito',
                'photo' => 'images/portraits/patrick-petito-cultura.webp',
                'roles' => 'author',
                'name_fr' => 'Patrick Petito',
                'name_en' => 'Patrick Petito',
                'role_fr' => 'Auteur',
                'role_en' => 'Author',
                'bio_fr' => 'Spécialiste de la voile traditionnelle martiniquaise, Patrick Petito co-scénarise notamment Nikou patron. Il anime des séances de dédicace et des rencontres en librairie.',
                'bio_en' => 'A specialist in traditional Martinican sailing, Patrick Petito co-writes titles such as Nikou patron. He hosts signings and in-store events.',
            ],
            [
                'slug' => 'ojf-junior',
                'photo' => 'images/portraits/jean-fritz-junior-odne.webp',
                'roles' => 'author',
                'name_fr' => 'Jean Fritz Junior ODNÉ',
                'name_en' => 'Jean Fritz Junior ODNÉ',
                'role_fr' => 'Auteur · artiste polyvalent · théâtre',
                'role_en' => 'Author · multidisciplinary artist · theatre',
                'bio_fr' => 'Jean Fritz Junior ODNÉ, Haïtien, né en 1986. C\'est un artiste aux multiples talents : musicien, auteur, conteur, comédien, marionnettiste, metteur en scène, directeur artistique… Il coopère avec des troupes de théâtre en Haïti et à l\'étranger.',
                'bio_en' => 'Jean Fritz Junior ODNÉ is Haitian, born in 1986. His practice spans music, writing, storytelling, acting, puppetry, stage direction, and artistic direction, collaborating with theatre companies in Haiti and abroad.',
            ],
            [
                'slug' => 'jf-silva',
                'photo' => 'images/portraits/francisco-silva.webp',
                'roles' => 'illustrator',
                'name_fr' => 'Jean Francisco Silva',
                'name_en' => 'Jean Francisco Silva',
                'role_fr' => 'Illustrateur · caricaturiste · peintre',
                'role_en' => 'Illustrator · caricaturist · painter',
                'bio_fr' => 'Jean Francisco Silva, Haïtien, né en 1989. Peintre, caricaturiste et illustrateur, diplômé de l\'École nationale des arts d\'Haïti. Formé en caricature, bande dessinée et dessin de presse, son talent s\'exprime dans des créations qui séduisent le public.',
                'bio_en' => 'Jean Francisco Silva is Haitian, born in 1989. A painter, caricaturist, and illustration graduate of Haiti\'s École nationale des arts, trained in caricature, comics, and press drawing, his work speaks to and captivates audiences.',
            ],
            [
                'slug' => 'collectif',
                'photo' => 'images/site/logo-editions-sucrier.webp',
                'roles' => 'author illustrator',
                'name_fr' => 'Collectif',
                'name_en' => 'Collective',
                'role_fr' => 'Créations collectives (affiches, stickers, déclinaisons)',
                'role_en' => 'Collective productions (posters, stickers, spin-offs)',
                'bio_fr' => 'Les titres signés « Collectif » réunissent plusieurs intervenant·es autour du même projet : affiches, planches de stickers ou déclinaisons des univers Nikou et Lettres ou bêtes.',
                'bio_en' => 'Titles credited to “Collectif” bring several contributors together on the same release: posters, sticker sheets, or spin-offs tied to Nikou and Lettres ou bêtes.',
                'hidden' => true,
            ],
        ],
    ];
}

/** @return array<string, mixed> */
function sucrier_default_heroes_data(): array
{
    return [
        'display_order' => ['nikou', 'bebe-nikou', 'exocette', 'tice-et-metice', 'alice-et-jacob'],
        'heroes' => [
            [
                'id' => 'nikou',
                'name_fr' => 'Nikou',
                'name_en' => 'Nikou',
                'tagline_fr' => 'Petit manicou curieux · Collection phare',
                'tagline_en' => 'Curious little opossum · Flagship series',
                'portrait' => 'images/catalog/nikou-surfeur.webp',
                'card_class' => 'heros-card--nikou',
                'image_fit' => 'contain',
                'image_position' => 'center 88%',
                'related_books' => 'nikou-champion,nikou-musicien-album,nikou-patron,nikou-formes,le-cahier-de-nikou,bebe-nikou-dit-non,bebe-nikou-a-faim',
                'intro_fr' => 'Créé en 2011 par l\'autrice-illustratrice Renata, cet infatigable petit manikou éveille et instruit les petits de 3 à 6 ans, de manière ludique, drôle et poétique. Depuis 2022, c\'est l\'illustrateur Wilfried Deroche qui lui donne vie. La collection Nikou compte 7 albums à ce jour.',
                'intro_en' => 'Created in 2011 by author-illustrator Renata, this tireless little opossum sets out to awaken and teach children aged 3 to 6 in a playful, funny, and poetic way. Since 2022, illustrator Wilfried Deroche has brought him to life. The Nikou series now includes 7 albums.',
                'traits_fr' => 'Curieux et têtu|Aime le sport et la musique|Héros inclusif|Quadrilingue',
                'traits_en' => 'Curious and stubborn|Loves sport and music|Inclusive hero|Quadrilingual books',
                'school_use_fr' => 'Les albums Nikou soutiennent les premiers apprentissages (formes, couleurs, nombres), l\'éveil linguistique (français, créole, espagnol, anglais) et l\'activité physique. La peluche est un médiateur idéal en maternelle pour ritualiser les temps de lecture.',
                'school_use_en' => 'Nikou books support early learning (shapes, colours, counting), language awareness (French, Creole, Spanish, English), and physical activity. The plush toy is an ideal classroom companion to anchor story time.',
            ],
            [
                'id' => 'bebe-nikou',
                'name_fr' => 'Bébé Nikou',
                'name_en' => 'Baby Nikou',
                'tagline_fr' => 'Tout-petit attachant · Collection cartonnée',
                'tagline_en' => 'Adorable toddler · Board book series',
                'portrait' => 'images/heros/bebe-nikou.png',
                'card_class' => 'heros-card--bebe',
                'image_fit' => 'contain',
                'image_position' => 'center center',
                'related_books' => 'bebe-nikou-dit-non,bebe-nikou-a-faim,stickers-fruits-martinique',
                'intro_fr' => 'Le petit frère de Nikou voit le jour en 2021 sous les doigts de l\'illustrateur Wilfried Deroche et la plume de Renata. Il s\'adresse aux tout-petits de moins de 3 ans. Sa collection compte à ce jour 2 albums.',
                'intro_en' => 'Nikou\'s little brother was born in 2021, illustrated by Wilfried Deroche and written by Renata. He speaks to children under 3. The series currently includes 2 board books.',
                'traits_fr' => 'Dès 1 an|Albums tout-carton|Quadrilingue|Éveil sensoriel',
                'traits_en' => 'From age 1|Board books|Quadrilingual|Sensory awakening',
                'school_use_fr' => 'Bébé Nikou a faim favorise l\'éveil linguistique, la découverte des fruits locaux et l\'éducation nutritionnelle. Bébé Nikou dit non invite à parler des émotions et de la patience des adultes.',
                'school_use_en' => 'Bébé Nikou a faim supports language awareness, local fruit discovery, and nutritional education. Bébé Nikou dit non opens conversations about emotions and adult patience.',
            ],
            [
                'id' => 'exocette',
                'name_fr' => 'Exocette',
                'name_en' => 'Exocette',
                'tagline_fr' => 'Poisson volant courageux · Mer et différence',
                'tagline_en' => 'Brave flying fish · Sea and difference',
                'portrait' => 'images/heros/exocette.png',
                'card_class' => 'heros-card--exocette',
                'image_fit' => 'contain',
                'image_position' => 'center center',
                'related_books' => 'exocette,exocette-et-la-mer-de-plastique',
                'intro_fr' => 'Malgré son handicap, elle n\'a pas peur des pêcheurs et rien ne lui résiste. Cette petite femelle poisson volant caribéenne, apparue en 2020, est la création de l\'autrice Renata, magistralement illustrée par Wilfried Deroche.',
                'intro_en' => 'Despite her disability, she is not afraid of fishermen and nothing stops her. This little Caribbean flying fish, who appeared in 2020, was created by author Renata and magnificently illustrated by Wilfried Deroche.',
                'traits_fr' => 'Courageuse|Humour et tendresse|Handicap abordé avec pudeur|Partenaires scientifiques',
                'traits_en' => 'Brave|Gentle humour|Disability addressed with care|Scientific partners',
                'school_use_fr' => 'L\'album aborde avec humour et tendresse la problématique du handicap, valorise l\'activité physique et enrichit la connaissance du milieu marin.',
                'school_use_en' => 'The book addresses disability with humour and tenderness, encourages physical activity, and builds knowledge of the marine environment.',
            ],
            [
                'id' => 'tice-et-metice',
                'name_fr' => 'Tice et Métice',
                'name_en' => 'Tice and Métice',
                'tagline_fr' => 'Deux oiseaux, sept voyages · Acceptation de l\'autre',
                'tagline_en' => 'Two birds, seven journeys · Accepting difference',
                'portrait' => 'images/heros/tice-et-metice.png?v=20260519-nobg',
                'card_class' => 'heros-card--tice',
                'image_fit' => 'contain',
                'image_position' => 'center center',
                'related_books' => 'tice-et-metice',
                'intro_fr' => 'Créés en 2023 à Chypre par l\'autrice franco-chypriote Karine Petevi et l\'illustrateur Gecko Dalch, ces deux oiseaux nous entraînent à la découverte de l\'autre et du monde.',
                'intro_en' => 'Created in 2023 in Cyprus by Franco-Cypriot author Karine Petevi and illustrator Gecko Dalch, these two birds invite readers to discover others and the world.',
                'traits_fr' => 'Album quadrilingue|Éveil des sens|Voyages et cultures|Mise en voix théâtrale',
                'traits_en' => 'Quadrilingual album|Awakening the senses|Journeys and cultures|Great for dramatic reading',
                'school_use_fr' => 'Six couleurs, six voyages pour découvrir le monde depuis la Martinique. L\'album sollicite la vision, l\'odorat, l\'ouïe et le toucher.',
                'school_use_en' => 'Six colours, six journeys to discover the world from Martinique. The book engages sight, smell, hearing, and touch.',
            ],
            [
                'id' => 'alice-et-jacob',
                'name_fr' => 'Alice et Jacob',
                'name_en' => 'Alice and Jacob',
                'tagline_fr' => 'Jeunes enquêteurs · Collection Bulles de Sucrier',
                'tagline_en' => 'Young detectives · Bulles de Sucrier series',
                'portrait' => 'images/heros/alice-et-jacob.jpg',
                'card_class' => 'heros-card--alice',
                'image_fit' => 'contain',
                'image_position' => 'center center',
                'related_books' => 'circuit-ferme',
                'intro_fr' => 'Les deux héros de la BD jeunesse caribéenne sont nés en 2022 sous la plume et les doigts de Jean Fritz Junior Odne et Jean Francisco Sliva, artistes haïtiens.',
                'intro_en' => 'The two heroes of this Caribbean graphic novel for young readers were born in 2022, written and drawn by Haitian artists Jean Fritz Junior Odne and Jean Francisco Sliva.',
                'traits_fr' => 'Esprit d\'équipe|Curiosité|Regard décalé sur l\'actualité|Bande dessinée',
                'traits_en' => 'Team spirit|Curiosity|Offbeat take on current events|Graphic novel',
                'school_use_fr' => 'Circuit fermé propose une enquête menée par deux enfants : démarche de résolution de problème et lecture de l\'image en bande dessinée. Adapté au cycle 3.',
                'school_use_en' => 'Closed Circuit offers a mystery led by two children: problem-solving and reading images in comics form. Suited to upper elementary.',
            ],
        ],
    ];
}

function sucrier_ensure_profile_files(): void
{
    $authorsPath = sucrier_authors_json_path();
    if (!is_file($authorsPath)) {
        $json = json_encode(sucrier_default_authors_data(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($json !== false) {
            @file_put_contents($authorsPath, $json);
        }
    }
    $heroesPath = sucrier_heroes_json_path();
    if (!is_file($heroesPath)) {
        $json = json_encode(sucrier_default_heroes_data(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($json !== false) {
            @file_put_contents($heroesPath, $json);
        }
    }
}

/** @return array<string, mixed> */
function sucrier_load_authors_data(): array
{
    sucrier_ensure_profile_files();
    $path = sucrier_authors_json_path();
    if (!is_readable($path)) {
        return sucrier_default_authors_data();
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) {
        return sucrier_default_authors_data();
    }
    if (!isset($data['authors']) || !is_array($data['authors'])) {
        $data['authors'] = [];
    }
    if (!isset($data['page']) || !is_array($data['page'])) {
        $data['page'] = sucrier_default_authors_data()['page'];
    }

    return $data;
}

/** @return array<string, mixed> */
function sucrier_load_heroes_data(): array
{
    sucrier_ensure_profile_files();
    $path = sucrier_heroes_json_path();
    if (!is_readable($path)) {
        return sucrier_default_heroes_data();
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) {
        return sucrier_default_heroes_data();
    }
    if (!isset($data['heroes']) || !is_array($data['heroes'])) {
        $data['heroes'] = [];
    }
    if (!isset($data['display_order']) || !is_array($data['display_order'])) {
        $data['display_order'] = array_map(
            static fn(array $h): string => (string) ($h['id'] ?? ''),
            $data['heroes']
        );
    }

    return $data;
}

/** @param array<string, mixed> $data */
function sucrier_save_authors_data(array $data): bool
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }

    return @file_put_contents(sucrier_authors_json_path(), $json) !== false;
}

/** @param array<string, mixed> $data */
function sucrier_save_heroes_data(array $data): bool
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }

    return @file_put_contents(sucrier_heroes_json_path(), $json) !== false;
}

/**
 * Fusionne auteurs / héros dans le payload public content.php.
 *
 * @param array<string, mixed> $data
 * @return array<string, mixed>
 */
function sucrier_attach_cms_profiles(array $data): array
{
    sucrier_ensure_profile_files();
    $authors = sucrier_load_authors_data();
    $heroes = sucrier_load_heroes_data();
    $data['authors_page'] = $authors['page'] ?? [];
    $data['authors'] = $authors['authors'] ?? [];
    $data['hero_display_order'] = $heroes['display_order'] ?? [];
    $data['heroes'] = $heroes['heroes'] ?? [];

    return $data;
}
