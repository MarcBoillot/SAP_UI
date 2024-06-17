# MFA template

## Les Affichages 

### 1_Affichage d'une demande identification
*il faudra gérer les droits de chaque user*
### 2_Affichage des 4 secteurs pour lesquels l'application va etre utilisée
1. La gestion des stocks
2. La reception
3. La préparation 
4. Le controle (avec l'expedition)


#### 1.La gestion des stocks
1. Affichage selection par recherche un article (par designation ou son code article)
2. Affichage de l'article selectionné avec differents champs 
    * Son ou ses codebars (possbilité d'imprimer)
    * Code article
    * designation 
    * numero de serie s'il en possede un
    * Ses differents emplacements avec les quantités attribuées.

#### 2.La reception
*Une fois la reception validée la mise en stock sera faite par MFA dans SAP.*
*Un message d'alerte s'affichera dans SAP pour signaler la fin de reception.*

1. Selection affichage liste des receptions 
   * Affichage de la liste des receptions (celles qui sont en cours ou en attente de mise en stock) et de leurs statuts
     * definir les differents champs a afficher
2. Selection affichage creation d'une reception
   * Affichage selection par recherche du fournisseur par son code ou sa designation
   * Affichage scanner de codebar
   * Affichage des differents champs a completer 
     * Codebar
     * code article
     * designation
     * quantité
     * zone de stockage (defini dans dans sap ?)
     * numero de serie
     * defaut (avec photo possible)
   * Affichage de la ligne validée (statut ?)
   * Affichage codebar non géré (avec une recherche par article)
   * Affichage pour l'impression de codebar (avec la quantité)


#### 3.La preparation 
*Les commandes seront attribuées par l'ayant droit dans SAP*
1. Affichage de la liste des commandes a preparer avec un status (terminer, en cours ou urgent)
2. Affichage des lignes a preparer avec differents champs
    * codebar
    * numero de serie par selection avec leurs dates
    * designation
    * qté saisi
    * qté restante 
    * les stocks
3. Affichage spécifique pour les stocks

#### 4.Le controle
1. Affichage de la liste des commandes terminées
2. Affichage des articles de la commande en lecture 
3. Affichage des articles de la commandes en mode edition
4. Affichage des stocks de l'article 
5. Affichage expedition 
    * un champs transporteur
    * Poids
    * Type de palette 
6. Affichage pop-up de la validation