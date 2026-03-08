### Summary (Résumé)

Ce projet consiste à développer le backend d'une application FinTech axée sur la gestion de finances personnelles. Il s'agit d'une API RESTful robuste conçue pour enregistrer des flux financiers (revenus et dépenses) et assurer le suivi en temps réel du solde d'un utilisateur, en préparation d'une future intégration avec une application web ou mobile.

### Objective (Objectifs)

L'objectif principal est de concevoir un service fiable capable de traiter des transactions financières tout en respectant des règles métier strictes. L'API doit calculer dynamiquement le solde courant (sans le stocker en base de données), bloquer systématiquement toute dépense entraînant un solde négatif, et fournir des statistiques financières détaillées et agrégées.

### Tech Stack (Technologies)

L'API sera développée en environnement **Node.js** en utilisant le framework **Express.js** pour la gestion des routes et des middlewares. La base de données choisie est **MongoDB** (NoSQL), ce qui permet une flexibilité dans le modèle de données. La stack inclut également **express-validator** pour la centralisation de la validation des données entrantes, avec une utilisation stricte de l'asynchronisme (`async/await`).

### Data Architecture & Business Logic (Architecture des données & Logique métier)

L'architecture de base s'articule autour d'une collection unique `Transactions` (ou incluant des collections additionnelles `Category` et `Budget` en bonus). La logique métier repose sur un calcul à la volée : `balance = totalIncome - totalExpense`. Un middleware personnalisé agira comme un garde-fou avant chaque insertion de dépense pour s'assurer que le montant est strictement positif, qu'une catégorie est assignée, et que le solde ne tombe jamais en dessous de zéro.

### Feature (Fonctionnalités)

Les fonctionnalités clés du système comprennent :

- **Gestion des transactions :** Ajout sécurisé de revenus ou de dépenses avec interception des erreurs de solde (Erreur 400).
    
- **Listing avancé :** Un système de pagination couplé à des filtres combinables (date, période, catégorie, type).
    
- **Analytique :** Génération de statistiques mensuelles (totaux, soldes, répartition en pourcentage par catégorie).
    
- **Bonus (Optionnels) :** Exportation des données (JSON/CSV), gestion dynamique des catégories, et définition d'alertes de dépassement de budget mensuel.
    

### Conclusion

En conclusion, ce projet de 5 jours vise à livrer une API backend performante, sécurisée et prête à être consommée par un front-end. Il met particulièrement l'accent sur l'intégrité des données financières, la gestion rigoureuse des middlewares et des erreurs, posant ainsi les bases d'un outil de gestion financière personnel fiable.

