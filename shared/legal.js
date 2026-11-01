// Terms and Privacy text (template). Uses the business details from Admin > Settings.
// This is a plain-language template, not legal advice: have an accountant or lawyer check it before launch.
import { esc } from './ui.js';

const who = (st, el) => {
  const n = st.businessName || st.shopName || 'Gewy Builds';
  const parts = [n];
  if (st.taxId) parts.push((el ? 'ΑΦΜ: ' : 'Tax ID (AFM): ') + st.taxId);
  if (st.contactEmail) parts.push('Email: ' + st.contactEmail);
  if (st.phone) parts.push((el ? 'Τηλ.: ' : 'Phone: ') + st.phone);
  return parts.join(' · ');
};
const sec = (h, ...ps) => `<h3 style="margin:16px 0 4px;font-size:15px">${esc(h)}</h3>` + ps.map((p) => `<p style="margin:0 0 8px;line-height:1.5">${esc(p)}</p>`).join('');

export function termsHtml(lang, st) {
  const el = lang === 'el';
  if (el) return sec('Ποιοι είμαστε', who(st, true), 'Πουλάμε 3D-εκτυπωμένα αντικείμενα και φτιάχνουμε προσαρμοσμένες εκτυπώσεις κατόπιν παραγγελίας.')
    + sec('Παραγγελίες και τιμές', 'Οι τιμές είναι σε ευρώ. Η παραγγελία ολοκληρώνεται όταν επιβεβαιώσουμε τη διαθεσιμότητα και, όπου χρειάζεται, λάβουμε την πληρωμή ή την προκαταβολή.')
    + sec('Περιοχές και παράδοση', 'Παράδοση με το χέρι (χειροπαράδοση) μόνο στις περιοχές της λίστας του καταστήματος. Με Box Now ή ACS αποστέλλουμε μόνο εντός Ελλάδας, στις περιοχές της λίστας. Δεν αποστέλλουμε εκτός Ελλάδας.')
    + sec('Πληρωμή', 'Μπορείς να πληρώσεις κατά την παράδοση ή online μέσω του συνδέσμου πληρωμής μας. Για αποστολή με κούριερ, μπορεί να ζητηθεί προκαταβολή πριν την αποστολή και το υπόλοιπο κατά την παραλαβή. Η αποστολή γίνεται αφού επιβεβαιωθεί η προκαταβολή.')
    + sec('Προσαρμοσμένες παραγγελίες', 'Τα αιτήματα custom δεν σε δεσμεύουν. Πληρώνεις μόνο αφού εγκρίνεις την τιμή. Τα προϊόντα που φτιάχνονται ειδικά για σένα δεν επιστρέφονται, εκτός αν έχουν ελάττωμα.')
    + sec('Δικαίωμα υπαναχώρησης', 'Για αγορές από απόσταση, έχεις δικαίωμα να υπαναχωρήσεις εντός 14 ημερών από την παραλαβή, για τα έτοιμα προϊόντα. Το δικαίωμα δεν ισχύει για προϊόντα που κατασκευάστηκαν σύμφωνα με τις προδιαγραφές σου. Επικοινώνησε μαζί μας για να το ενεργοποιήσεις.')
    + sec('Μη παραλαβή', 'Αν δεν παραλάβεις δέμα που έχει αποσταλεί, η προκαταβολή μπορεί να χρησιμοποιηθεί για την κάλυψη του κόστους παραγωγής και αποστολής.')
    + sec('Ελαττώματα', 'Αν το προϊόν έχει ελάττωμα ή φτάσει χαλασμένο, στείλε μας φωτογραφία και θα το αντικαταστήσουμε ή θα σου επιστρέψουμε τα χρήματα.')
    + sec('Φωτογραφίες και χρώματα', 'Τα χρώματα και η λεπτομέρεια μπορεί να διαφέρουν ελαφρά από τις φωτογραφίες. Οι εικόνες-ιδέες είναι ενδεικτικές.')
    + sec('Επικοινωνία', who(st, true));
  return sec('Who we are', who(st, false), 'We sell 3D-printed items and make custom prints to order.')
    + sec('Orders and prices', 'Prices are in euros. An order is confirmed once we check availability and, where needed, receive your payment or deposit.')
    + sec('Areas and delivery', 'Hand delivery only in the areas on the shop list. Box Now or ACS courier only inside Greece, to the areas on the list. We do not ship outside Greece.')
    + sec('Payment', 'You can pay when you receive the item, or online through our payment link. For courier delivery we may ask for a deposit before shipping and the rest when you collect it. We ship after the deposit has arrived.')
    + sec('Custom requests', 'A custom request does not commit you to anything. You only pay after you approve the price. Items made specially for you cannot be returned unless they are faulty.')
    + sec('Right to cancel', 'For distance purchases of ready-made items you can cancel within 14 days of receiving them. This right does not apply to items made to your specification. Contact us to use it.')
    + sec('Not collected', 'If you do not collect a parcel that was shipped, the deposit may be kept to cover the cost of making and shipping it.')
    + sec('Faults', 'If an item is faulty or arrives damaged, send us a photo and we will replace it or refund you.')
    + sec('Photos and colors', 'Colors and fine detail can differ slightly from the photos. Idea pictures are only a guide.')
    + sec('Contact', who(st, false));
}

export function privacyHtml(lang, st) {
  const el = lang === 'el';
  if (el) return sec('Υπεύθυνος επεξεργασίας', who(st, true))
    + sec('Τι δεδομένα συλλέγουμε', 'Όνομα, τηλέφωνο, περιοχή και διεύθυνση, τα προϊόντα της παραγγελίας σου, τα μηνύματα και οι φωτογραφίες που στέλνεις σε αιτήματα custom. Επίσης, ένα ανώνυμο αναγνωριστικό συσκευής με απλά στατιστικά (πρώτη/τελευταία επίσκεψη, αν εγκαταστάθηκε η εφαρμογή, τύπος κινητού, γλώσσα).')
    + sec('Γιατί', 'Για να εκτελέσουμε την παραγγελία και την παράδοση, να επικοινωνήσουμε μαζί σου και να κρατάμε τα λογιστικά μας. Τα στατιστικά τα χρησιμοποιούμε μόνο για να καταλαβαίνουμε πόσοι χρησιμοποιούν το κατάστημα.')
    + sec('Ποιοι τα βλέπουν', 'Εμείς. Για την αποστολή, το όνομα, το τηλέφωνο και η διεύθυνση/locker δίνονται στην εταιρεία κούριερ (Box Now ή ACS). Η βάση δεδομένων φιλοξενείται στο Google Firebase (Google Cloud, ΕΕ). Η πληρωμή γίνεται σε εξωτερική σελίδα (π.χ. PayPal ή Revolut) με δικούς της όρους. Δεν πουλάμε τα δεδομένα σου.')
    + sec('Πόσο καιρό', 'Τα στοιχεία παραγγελιών φυλάσσονται όσο απαιτεί η φορολογική νομοθεσία. Τα αιτήματα custom και τα μηνύματά τους διαγράφονται όταν δεν χρειάζονται πια, ή όταν το ζητήσεις.')
    + sec('Τα δικαιώματά σου', 'Μπορείς να ζητήσεις πρόσβαση, διόρθωση ή διαγραφή των δεδομένων σου, επικοινωνώντας μαζί μας. Έχεις επίσης δικαίωμα καταγγελίας στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (dpa.gr).')
    + sec('Αποθήκευση στη συσκευή', 'Η εφαρμογή αποθηκεύει στο κινητό σου τη γλώσσα, το καλάθι και τα στοιχεία επικοινωνίας σου, για να μην τα γράφεις ξανά. Δεν χρησιμοποιούμε cookies διαφήμισης.');
  return sec('Who is responsible', who(st, false))
    + sec('What we collect', 'Your name, phone, area and address, the items in your order, and the messages and photos you send in custom requests. Also an anonymous device ID with simple stats (first and last visit, whether the app was installed, phone type, language).')
    + sec('Why', 'To prepare and deliver your order, to contact you, and to keep our accounts. The stats only tell us how many people use the shop.')
    + sec('Who sees it', 'We do. For shipping, your name, phone and address or locker are given to the courier (Box Now or ACS). The database is hosted by Google Firebase (Google Cloud, EU). Payment happens on an outside page (for example PayPal or Revolut) under its own terms. We do not sell your data.')
    + sec('How long', 'Order records are kept as long as tax law requires. Custom requests and their messages are deleted when no longer needed, or when you ask.')
    + sec('Your rights', 'You can ask to see, correct or delete your data by contacting us. You can also complain to the Hellenic Data Protection Authority (dpa.gr).')
    + sec('On your phone', 'The app stores your language, cart and contact details on your phone so you do not have to type them again. We do not use advertising cookies.');
}
