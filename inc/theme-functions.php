<?php
// Empêcher l'accès direct au fichier
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Chargement des scripts et styles du thème
 */
function sucrier_scripts() {
    wp_enqueue_style( 'sucrier-fonts', 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap', array(), null );
    wp_enqueue_style( 'sucrier-style', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', 'sucrier_scripts' );

/**
 * Ajout des fonctionnalités de base supportées par le thème
 */
function sucrier_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
}
add_action( 'after_setup_theme', 'sucrier_setup' );
