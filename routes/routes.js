const express = require("express");
const Contact = require("../models/Contact");

const router = express.Router();

router.post("/identify", async (req, res) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: "Email or phone number required" });
    }

    try {
        const existingContacts = await Contact.find({
            $or: [{ email }, { phoneNumber }]
        });

        let primaryContact = existingContacts.find(contact => contact.linkPrecedence === "primary");
        let secondaryContacts = existingContacts.filter(contact => contact.linkPrecedence === "secondary");

        if (!primaryContact) {
            // No existing contact, create a new primary contact
            const newContact = new Contact({
                email,
                phoneNumber,
                linkPrecedence: "primary"
            });
            await newContact.save();

            return res.status(200).json({
                contact: {
                    primaryContactId: newContact._id,
                    emails: [email],
                    phoneNumbers: [phoneNumber],
                    secondaryContactIds: []
                }
            });
        }

        if (!existingContacts.some(contact => contact.email === email && contact.phoneNumber === phoneNumber)) {
            // Create a new secondary contact if new info is provided
            const newSecondary = new Contact({
                email,
                phoneNumber,
                linkedId: primaryContact._id,
                linkPrecedence: "secondary"
            });
            await newSecondary.save();
            secondaryContacts.push(newSecondary);
        }

        const updatedContacts = await Contact.find({ linkedId: primaryContact._id });

        res.status(200).json({
            contact: {
                primaryContactId: primaryContact._id,
                emails: [...new Set([...existingContacts, ...updatedContacts].map(c => c.email).filter(Boolean))],
                phoneNumbers: [...new Set([...existingContacts, ...updatedContacts].map(c => c.phoneNumber).filter(Boolean))],
                secondaryContactIds: updatedContacts.map(c => c._id)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
