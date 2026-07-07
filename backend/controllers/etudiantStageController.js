const EtudiantStage = require('../models/etudiantStageModel');

const EtudiantStageController = {
    getAll : async (req, res) => {
        try {
            const { Idstage, Idetudiant } = req.query;
            let associations;
            if (Idstage) {
                associations = await EtudiantStage.getByStage(Idstage);
            } else if (Idetudiant) {
                associations = await EtudiantStage.getByEtudiant(Idetudiant);
            } else {
                associations = await EtudiantStage.getAll();
            }
            res.json(associations);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    getByEtudiant : async (req, res) => {
        const { IdEtudiant } = req.params;
        try {
            const StageEtudiant = await EtudiantStage.getByEtudiant(IdEtudiant);
            if (!StageEtudiant) {
                return res.status(404).json({ message: 'Associations not found' });
            }
            res.json(StageEtudiant);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    getById : async (req, res) => {
        try {
            const association = await EtudiantStage.getById(req.params.id);
            if (!association) {
                return res.status(404).json({ message: 'Association not found' });
            }
            res.json(association);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    
    create : async (req, res) => {
        try {
            const newAssociation = await EtudiantStage.create(req.body);
            res.status(201).json(newAssociation);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    
    update : async (req, res) => {
        try {
            const updatedAssociation = await EtudiantStage.update(req.params.id, req.body);
            res.json(updatedAssociation);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    
    delete : async (req, res) => {
        try {
            await EtudiantStage.delete(req.params.id);
            res.json({ message: 'Association deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateRapportStatut : async (req, res) => {
        const { id } = req.params;
        const { statut } = req.body;
        if (!["valide", "rejete"].includes(statut)) {
            return res.status(400).json({ error: "Statut invalide (valide ou rejete)" });
        }
        try {
            await EtudiantStage.update(id, { rapport_statut: statut });
            return res.json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
        }
    },
}
module.exports = EtudiantStageController