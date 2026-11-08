import * as B from './shared/backend.js';
import { termsHtml, privacyHtml } from './shared/legal.js';
import { startWelcome, greeting, welcomeBack } from './shared/welcome.js';
import { cacheGet, cacheSet } from './shared/cache.js';
import { HANDOFF_DEF, COURIER_DEF, parseAreas } from './shared/areas.js';
import { optionsOf, stockOf, lineOut, wasPrice, pctOff } from './shared/stock.js';
import { $, $$, esc, eur, toast, sheet, ago, copy, fillPayLink, waNumber, getTheme, setTheme, themeIcon } from './shared/ui.js';

const CFG = globalThis.GEWY_CONFIG || {};

/* ------------------------------------------------------------ translations */
const DICT = {
  en: {
    shop: 'Shop', custom: 'Custom', orders: 'My orders', new: 'NEW', soldOut: 'Sold out',
    heroTitle: 'Printed here. Handed to you.',
    heroSub: '3D printed products made locally — or ask for something made just for you.',
    noProducts: 'Nothing here yet. Check back soon, new prints are on the way.',
    notifyBtn: 'Tell me when new products drop', notifyOn: 'Notifications are on',
    notifyDenied: 'Notifications are blocked. Allow them in your browser/phone settings.',
    notifyIos: 'On iPhone: tap Share, then "Add to Home Screen". Open the app from your home screen and turn notifications on.',
    notifyThanks: 'Done! You will get a notification for new products.',
    yourText: 'Your text', maxLetters: 'Max {n} letters', textNeeded: 'Please fill in: {l}',
    add: 'Add to cart', buyNow: 'Buy now', color: 'Color', added: 'Added to cart',
    cart: 'Your cart', cartEmpty: 'Your cart is empty.', total: 'Total', checkout: 'Checkout', remove: 'Remove',
    via: 'Tell me about delivery on', viaWa: 'WhatsApp', viaViber: 'Viber', viaBoth: 'Both', viaSms: 'SMS', viaHint: 'We message you only about your delivery, on the app you pick. Saved for next time.',
    yourName: 'Your name', phone: 'Phone', phoneHint: 'So I can reach you about delivery',
    how: 'How do you want to get it?', deliver: 'Deliver to me', deliverDesc: 'I bring it to you.',
    meetup: 'Meet up / pick up', meetupDesc: 'We agree on a spot.',
    address: 'Address or area', meetWhere: 'Where / when could we meet?', note: 'Notes (optional)',
    payHow: 'How do you want to pay?',
    payHandoff: 'Pay at handoff', payHandoffDesc: 'Nothing to pay now. Pay when you get it: cash, or card/Revolut at the door.',
    payOnline: 'Pay online now', payOnlineDesc: 'Secure payment page ({label}). Your order is confirmed once I see the payment.',
    placeOrder: 'Place order', fillRequired: 'Please add your name and phone.', needAddress: 'Please add an address or area.',
    orderPlaced: 'Order placed!', orderNo: 'Order number', payNow: 'Pay now', payAmount: 'Amount to pay',
    payNote: 'Write the order number in the payment note, so I can match it.',
    handoffThanks: 'I will message you to arrange the handoff. You pay when you receive it.',
    savedInOrders: 'Your order is saved in "My orders" — you can pay from there any time.',
    done: 'Done', contact: 'Contact', call: 'Call', whatsapp: 'WhatsApp',
    noOrders: 'No orders yet.',
    st_new: 'Received', st_making: 'Printing', st_ready: 'Ready', st_delivered: 'Delivered', st_cancelled: 'Cancelled',
    paid: 'Paid', unpaid: 'Not paid yet', atHandoff: 'Pay at handoff', depPaid: 'Deposit paid',
    busyTitle: 'The shop is very busy right now', busyText: 'This could not be sent. Send it to me on WhatsApp instead and I will take care of it.', busyWA: 'Send on WhatsApp', busyCopy: 'Copy the message',
    busyShop: 'The shop is very busy right now. Please try again in a little while, or message me on WhatsApp.',
    welcomeTitle: 'Before you start', welcomeText: 'To use the shop, please read and accept our Terms and Privacy. They explain delivery areas, payments, deposits and how we handle your details.', accept: 'Accept and continue',
    terms: 'Terms', privacy: 'Privacy', agree: 'I agree to the Terms and Privacy', agreeNeeded: 'Please tick the box to agree to the Terms and Privacy',
    ownIt: 'I own this design or picture, or I have permission to use it. I understand you may refuse or remove anything that infringes copyright.', ownNeeded: 'Please confirm you own the design or have permission to use it',
    area: 'Your area', chooseArea: 'Choose your area…', areaNeeded: 'Please choose your area first',
    areaHint: 'Delivery by me: Salamina and Athens only.', areaHintBox: 'Box Now / ACS: Greece only, from the areas in the list.',
    reqLimit: 'You can send up to {n} custom requests per day. Please try again tomorrow.',
    boxnow: 'Box Now / ACS courier', boxnowDesc: 'Courier or Box Now locker, anywhere in the listed areas of Greece.', boxWhere: 'Which Box Now locker? (name or area)',
    deposit: 'Pay now (deposit)', balance: 'Pay at the locker', fee: 'Delivery fee',
    boxExplain: 'You pay a small deposit now. The rest you pay online when your parcel arrives in the locker (Box Now sends you the link).',
    depNote: 'Pay the deposit now. The rest is paid when the parcel arrives in the Box Now locker.',
    balLeft: 'Left to pay at the locker',
    customTitle: 'Want something made just for you?',
    customSub: 'Describe it and add a photo if you have one. I will send you a preview of how it would look and a price. Like it? Approve and order. You pay nothing until you approve.',
    newReq: 'New custom request', noReqs: 'No custom requests yet.',
    reqTitle: 'What do you want made?', reqTitleP: 'e.g. Name sign for my room',
    reqDesc: 'Describe it', reqDescP: 'Size, colors, text, what it is for...',
    reqBudget: 'Budget (optional)', reqPhoto: 'Reference photos', sendReq: 'Send request', sent: 'Request sent!',
    rq_new: 'Sent', rq_discussing: 'In talks', rq_quoted: 'Preview and price ready', rq_approved: 'Approved',
    rq_printing: 'Printing', rq_done: 'Done', rq_closed: 'Closed',
    msgP: 'Write a message...', send: 'Send', quoteReady: 'Price for your item', approve: 'Approve and order',
    quoteHint: 'Not what you imagined? Just reply below and I will change it.',
    you: 'You', maker: 'Gewy Builds', details: 'Details', trust: 'Handmade on the island · hand delivery · pay when you receive it',
    install: 'Install the app', installTitle: 'Install on iPhone', installDone: 'Installed!',
    installSteps: '1. Tap the Share button at the bottom of Safari (the square with an arrow).\n2. Scroll down and tap "Add to Home Screen".\n3. Tap "Add". The Gewy Builds icon appears on your home screen.',
    err: 'Something went wrong. Please try again.', sending: 'Sending...',
    about: 'About', aboutH: 'About us', aboutDefault: 'Gewy Builds is a small 3D printing workshop. Every item is printed to order and handed to you locally, or sent by courier anywhere in Greece. You can also ask for something made just for you.',
    aboutContact: 'Contact', aboutEmail: 'Email', aboutAreas: 'Where we deliver', aboutHand: 'Hand delivery', aboutCourier: 'Box Now / ACS courier', aboutHow: 'How it works',
    aboutHowText: '1. Pick a product, or send a custom request.\n2. Choose how you want to get it and how you pay.\n3. I print it and message you when it is ready.',
    lowStock: 'Low stock', backSoon: 'Back soon', outNote: 'This one is sold out right now. It will be back soon.',
    share: 'Share', linkCopied: 'Link copied', qty: 'Quantity',
    preorder: 'Pre-order', preorderHint: 'Want it when it is back? Send a pre-order request. I will confirm the price and when it will be ready. You pay nothing until you approve.', preorderSent: 'Pre-order sent!', needAccount: 'Please log in or create an account to pre-order.',
    cartOut: 'Out of stock · back soon', cartBack: 'Back in stock!', cartAddAgain: 'Add to cart', cartNothing: 'Nothing available to buy right now.',
    soldWhile: 'Sorry, these just sold out: {n}. They moved to the bottom of your cart.', priceChanged: 'Some prices changed. Please check your order and try again.', gone: 'Not available anymore',
    account: 'Account', accOptional: 'An account is optional. You can always order as a guest.', accWhy: 'With an account you see your orders and requests on any phone, and you can pre-order sold-out items.',
    login: 'Log in', signup: 'Create account', email: 'Email', password: 'Password (6+ characters)', forgot: 'Forgot password?', resetSent: 'If this email has an account, a reset link is on its way.',
    logout: 'Log out', loggedAs: 'Logged in as', verified: 'Email verified', notVerified: 'Email not verified yet', resend: 'Send the verification email again', verifySent: 'Verification email sent', accDone: 'Account created!',
    accNudge: 'Create a free account to keep your orders on any phone.', accNew: 'No account yet?', accHave: 'Already have an account?', typeEmail: 'Type your email first.',
    e_exists: 'This email already has an account. Try logging in.', e_email: 'Please enter a valid email.', e_weak: 'The password needs at least 6 characters.', e_bad: 'Wrong email or password.', e_many: 'Too many tries. Please wait a few minutes.', e_net: 'No connection. Please try again.', e_err: 'Something went wrong. Please try again.',
    phoneBoxHint: 'Box Now will text your pickup code to this number.', phoneOk: 'I checked: this number is correct and can receive SMS.', phoneNeeded: 'Please confirm your phone number is correct.',
    waOrder: 'Send order on WhatsApp', msgUs: 'Message us about this order', tracking: 'Tracking number', track: 'Track parcel', copyNo: 'Copy', boxCode: 'Box Now will text the pickup code to {p} when your parcel is in the locker.',
  },
  el: {
    shop: 'Κατάστημα', custom: 'Custom', orders: 'Παραγγελίες', new: 'ΝΕΟ', soldOut: 'Εξαντλήθηκε',
    heroTitle: 'Τυπωμένο εδώ. Παραδίδεται σε σένα.',
    heroSub: 'Προϊόντα 3D εκτύπωσης φτιαγμένα τοπικά — ή ζήτα κάτι φτιαγμένο ειδικά για σένα.',
    noProducts: 'Δεν υπάρχει τίποτα ακόμα. Ξαναπέρασε σύντομα, έρχονται νέα προϊόντα.',
    notifyBtn: 'Ειδοποίησέ με για νέα προϊόντα', notifyOn: 'Οι ειδοποιήσεις είναι ενεργές',
    notifyDenied: 'Οι ειδοποιήσεις είναι μπλοκαρισμένες. Επίτρεψέ τες από τις ρυθμίσεις του κινητού/προγράμματος περιήγησης.',
    notifyIos: 'Σε iPhone: πάτα Κοινοποίηση και μετά "Προσθήκη στην οθόνη Αφετηρίας". Άνοιξε την εφαρμογή από εκεί και ενεργοποίησε τις ειδοποιήσεις.',
    notifyThanks: 'Έτοιμο! Θα λαμβάνεις ειδοποίηση για κάθε νέο προϊόν.',
    yourText: 'Το κείμενό σου', maxLetters: 'Μέγιστο {n} γράμματα', textNeeded: 'Συμπλήρωσε: {l}',
    add: 'Προσθήκη στο καλάθι', buyNow: 'Αγορά τώρα', color: 'Χρώμα', added: 'Προστέθηκε στο καλάθι',
    cart: 'Το καλάθι σου', cartEmpty: 'Το καλάθι είναι άδειο.', total: 'Σύνολο', checkout: 'Ολοκλήρωση', remove: 'Αφαίρεση',
    via: 'Ενημέρωσέ με για την παράδοση στο', viaWa: 'WhatsApp', viaViber: 'Viber', viaBoth: 'Και τα δύο', viaSms: 'SMS', viaHint: 'Θα σου στείλουμε μήνυμα μόνο για την παράδοση, στην εφαρμογή που διαλέγεις. Αποθηκεύεται για την επόμενη φορά.',
    yourName: 'Όνομα', phone: 'Τηλέφωνο', phoneHint: 'Για να επικοινωνήσω μαζί σου για την παράδοση',
    how: 'Πώς θες να το παραλάβεις;', deliver: 'Παράδοση σε μένα', deliverDesc: 'Θα στο φέρω εγώ.',
    meetup: 'Συνάντηση / παραλαβή', meetupDesc: 'Συμφωνούμε ένα σημείο.',
    address: 'Διεύθυνση ή περιοχή', meetWhere: 'Πού / πότε μπορούμε να βρεθούμε;', note: 'Σημειώσεις (προαιρετικό)',
    payHow: 'Πώς θες να πληρώσεις;',
    payHandoff: 'Πληρωμή κατά την παράδοση', payHandoffDesc: 'Δεν πληρώνεις τώρα. Πληρώνεις όταν το παραλάβεις: μετρητά ή κάρτα/Revolut.',
    payOnline: 'Πληρωμή online τώρα', payOnlineDesc: 'Ασφαλής σελίδα πληρωμής ({label}). Η παραγγελία επιβεβαιώνεται μόλις δω την πληρωμή.',
    placeOrder: 'Ολοκλήρωση παραγγελίας', fillRequired: 'Συμπλήρωσε όνομα και τηλέφωνο.', needAddress: 'Συμπλήρωσε διεύθυνση ή περιοχή.',
    orderPlaced: 'Η παραγγελία καταχωρήθηκε!', orderNo: 'Αριθμός παραγγελίας', payNow: 'Πληρωμή τώρα', payAmount: 'Ποσό πληρωμής',
    payNote: 'Γράψε τον αριθμό παραγγελίας στο σχόλιο της πληρωμής για να την αντιστοιχίσω.',
    handoffThanks: 'Θα σου στείλω μήνυμα να κανονίσουμε την παράδοση. Πληρώνεις όταν το παραλάβεις.',
    savedInOrders: 'Η παραγγελία σου είναι στις "Παραγγελίες" — μπορείς να πληρώσεις από εκεί όποτε θες.',
    done: 'Τέλος', contact: 'Επικοινωνία', call: 'Κλήση', whatsapp: 'WhatsApp',
    noOrders: 'Δεν υπάρχουν παραγγελίες ακόμα.',
    st_new: 'Παρελήφθη', st_making: 'Σε εκτύπωση', st_ready: 'Έτοιμο', st_delivered: 'Παραδόθηκε', st_cancelled: 'Ακυρώθηκε',
    paid: 'Πληρώθηκε', unpaid: 'Απλήρωτο', atHandoff: 'Πληρωμή στην παράδοση', depPaid: 'Η προκαταβολή πληρώθηκε',
    busyTitle: 'Το κατάστημα έχει πολλή κίνηση τώρα', busyText: 'Δεν στάλθηκε. Στείλε το μου στο WhatsApp και θα το αναλάβω.', busyWA: 'Αποστολή στο WhatsApp', busyCopy: 'Αντιγραφή μηνύματος',
    busyShop: 'Το κατάστημα έχει πολλή κίνηση τώρα. Δοκίμασε ξανά σε λίγο ή στείλε μου μήνυμα στο WhatsApp.',
    welcomeTitle: 'Πριν ξεκινήσεις', welcomeText: 'Για να χρησιμοποιήσεις το κατάστημα, διάβασε και αποδέξου τους Όρους και το Απόρρητο. Εξηγούν περιοχές παράδοσης, πληρωμές, προκαταβολές και πώς χειριζόμαστε τα στοιχεία σου.', accept: 'Αποδοχή και συνέχεια',
    terms: 'Όροι', privacy: 'Απόρρητο', agree: 'Συμφωνώ με τους Όρους και το Απόρρητο', agreeNeeded: 'Τσέκαρε το κουτί για να συμφωνήσεις με τους Όρους και το Απόρρητο',
    ownIt: 'Το σχέδιο ή η φωτογραφία είναι δική μου ή έχω άδεια να τη χρησιμοποιήσω. Καταλαβαίνω ότι μπορείτε να αρνηθείτε ή να αφαιρέσετε ό,τι παραβιάζει πνευματικά δικαιώματα.', ownNeeded: 'Επιβεβαίωσε ότι το σχέδιο είναι δικό σου ή έχεις άδεια χρήσης',
    area: 'Η περιοχή σου', chooseArea: 'Διάλεξε περιοχή…', areaNeeded: 'Διάλεξε πρώτα την περιοχή σου',
    areaHint: 'Παράδοση από εμένα: μόνο Σαλαμίνα και Αθήνα.', areaHintBox: 'Box Now / ACS: μόνο Ελλάδα, από τις περιοχές της λίστας.',
    reqLimit: 'Μπορείς να στείλεις έως {n} αιτήματα custom την ημέρα. Δοκίμασε ξανά αύριο.',
    boxnow: 'Box Now / ACS courier', boxnowDesc: 'Κούριερ ή Box Now locker, στις περιοχές της λίστας στην Ελλάδα.', boxWhere: 'Ποιο Box Now locker; (όνομα ή περιοχή)',
    deposit: 'Πληρώνεις τώρα (προκαταβολή)', balance: 'Πληρώνεις στο locker', fee: 'Έξοδα αποστολής',
    boxExplain: 'Πληρώνεις τώρα μια μικρή προκαταβολή. Το υπόλοιπο το πληρώνεις online όταν το δέμα φτάσει στο locker (το Box Now σου στέλνει τον σύνδεσμο).',
    depNote: 'Πλήρωσε την προκαταβολή τώρα. Το υπόλοιπο πληρώνεται όταν το δέμα φτάσει στο Box Now locker.',
    balLeft: 'Υπόλοιπο στο locker',
    customTitle: 'Θες κάτι φτιαγμένο ειδικά για σένα;',
    customSub: 'Περίγραψέ το και πρόσθεσε φωτογραφία αν έχεις. Θα σου στείλω προεπισκόπηση και τιμή. Σου αρέσει; Το εγκρίνεις και παραγγέλνεις. Δεν πληρώνεις τίποτα μέχρι να εγκρίνεις.',
    newReq: 'Νέο αίτημα custom', noReqs: 'Δεν υπάρχουν αιτήματα ακόμα.',
    reqTitle: 'Τι θες να φτιαχτεί;', reqTitleP: 'π.χ. Επιγραφή με το όνομά μου',
    reqDesc: 'Περιγραφή', reqDescP: 'Μέγεθος, χρώματα, κείμενο, για τι το θες...',
    reqBudget: 'Budget (προαιρετικό)', reqPhoto: 'Φωτογραφίες αναφοράς', sendReq: 'Αποστολή αιτήματος', sent: 'Το αίτημα στάλθηκε!',
    rq_new: 'Στάλθηκε', rq_discussing: 'Συζήτηση', rq_quoted: 'Έτοιμη προεπισκόπηση και τιμή', rq_approved: 'Εγκρίθηκε',
    rq_printing: 'Σε εκτύπωση', rq_done: 'Ολοκληρώθηκε', rq_closed: 'Έκλεισε',
    msgP: 'Γράψε μήνυμα...', send: 'Αποστολή', quoteReady: 'Τιμή για το αντικείμενο', approve: 'Έγκριση και παραγγελία',
    quoteHint: 'Δεν είναι αυτό που φαντάστηκες; Απάντησε παρακάτω και θα το αλλάξω.',
    you: 'Εσύ', maker: 'Gewy Builds', details: 'Λεπτομέρειες', trust: 'Φτιαγμένο στο νησί · παράδοση με το χέρι · πληρώνεις όταν το παραλάβεις',
    install: 'Εγκατάσταση εφαρμογής', installTitle: 'Εγκατάσταση σε iPhone', installDone: 'Εγκαταστάθηκε!',
    installSteps: '1. Πάτα το κουμπί Κοινοποίηση κάτω στο Safari (το τετράγωνο με το βέλος).\n2. Κάνε κύλιση και πάτα "Προσθήκη στην οθόνη Αφετηρίας".\n3. Πάτα "Προσθήκη". Το εικονίδιο Gewy Builds εμφανίζεται στην αρχική οθόνη σου.',
    err: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.', sending: 'Αποστολή...',
    about: 'Σχετικά', aboutH: 'Σχετικά με εμάς', aboutDefault: 'Το Gewy Builds είναι ένα μικρό εργαστήριο 3D εκτύπωσης. Κάθε αντικείμενο τυπώνεται κατόπιν παραγγελίας και σου παραδίδεται τοπικά με το χέρι ή με κούριερ οπουδήποτε στην Ελλάδα. Μπορείς επίσης να ζητήσεις κάτι φτιαγμένο ειδικά για σένα.',
    aboutContact: 'Επικοινωνία', aboutEmail: 'Email', aboutAreas: 'Πού παραδίδουμε', aboutHand: 'Παράδοση με το χέρι', aboutCourier: 'Κούριερ Box Now / ACS', aboutHow: 'Πώς λειτουργεί',
    aboutHowText: '1. Διάλεξε προϊόν ή στείλε αίτημα custom.\n2. Επίλεξε πώς θες να το παραλάβεις και πώς θα πληρώσεις.\n3. Το τυπώνω και σου στέλνω μήνυμα όταν είναι έτοιμο.',
    lowStock: 'Λίγα τεμάχια', backSoon: 'Σύντομα ξανά', outNote: 'Αυτό έχει εξαντληθεί αυτή τη στιγμή. Θα επανέλθει σύντομα.',
    share: 'Κοινοποίηση', linkCopied: 'Ο σύνδεσμος αντιγράφηκε', qty: 'Ποσότητα',
    preorder: 'Προπαραγγελία', preorderHint: 'Το θες όταν επανέλθει; Στείλε αίτημα προπαραγγελίας. Θα επιβεβαιώσω την τιμή και πότε θα είναι έτοιμο. Δεν πληρώνεις τίποτα μέχρι να εγκρίνεις.', preorderSent: 'Η προπαραγγελία στάλθηκε!', needAccount: 'Συνδέσου ή φτιάξε λογαριασμό για να κάνεις προπαραγγελία.',
    cartOut: 'Εξαντλήθηκε · σύντομα ξανά', cartBack: 'Ξαναβρέθηκε σε απόθεμα!', cartAddAgain: 'Προσθήκη στο καλάθι', cartNothing: 'Δεν υπάρχει κάτι διαθέσιμο για αγορά αυτή τη στιγμή.',
    soldWhile: 'Λυπάμαι, μόλις εξαντλήθηκαν: {n}. Μεταφέρθηκαν στο κάτω μέρος του καλαθιού σου.', priceChanged: 'Κάποιες τιμές άλλαξαν. Έλεγξε την παραγγελία σου και δοκίμασε ξανά.', gone: 'Δεν είναι πια διαθέσιμο',
    account: 'Λογαριασμός', accOptional: 'Ο λογαριασμός είναι προαιρετικός. Μπορείς πάντα να παραγγείλεις ως επισκέπτης.', accWhy: 'Με λογαριασμό βλέπεις τις παραγγελίες και τα αιτήματά σου από οποιοδήποτε κινητό και μπορείς να κάνεις προπαραγγελία σε εξαντλημένα.',
    login: 'Σύνδεση', signup: 'Δημιουργία λογαριασμού', email: 'Email', password: 'Κωδικός (6+ χαρακτήρες)', forgot: 'Ξέχασες τον κωδικό;', resetSent: 'Αν αυτό το email έχει λογαριασμό, ένας σύνδεσμος επαναφοράς είναι καθ’ οδόν.',
    logout: 'Αποσύνδεση', loggedAs: 'Συνδεδεμένος ως', verified: 'Το email επιβεβαιώθηκε', notVerified: 'Το email δεν έχει επιβεβαιωθεί ακόμα', resend: 'Αποστολή ξανά του email επιβεβαίωσης', verifySent: 'Το email επιβεβαίωσης στάλθηκε', accDone: 'Ο λογαριασμός δημιουργήθηκε!',
    accNudge: 'Φτιάξε δωρεάν λογαριασμό για να βλέπεις τις παραγγελίες σου από οποιοδήποτε κινητό.', accNew: 'Δεν έχεις λογαριασμό;', accHave: 'Έχεις ήδη λογαριασμό;', typeEmail: 'Γράψε πρώτα το email σου.',
    e_exists: 'Αυτό το email έχει ήδη λογαριασμό. Δοκίμασε σύνδεση.', e_email: 'Γράψε ένα έγκυρο email.', e_weak: 'Ο κωδικός θέλει τουλάχιστον 6 χαρακτήρες.', e_bad: 'Λάθος email ή κωδικός.', e_many: 'Πολλές προσπάθειες. Περίμενε λίγα λεπτά.', e_net: 'Δεν υπάρχει σύνδεση. Δοκίμασε ξανά.', e_err: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.',
    phoneBoxHint: 'Το Box Now θα στείλει τον κωδικό παραλαβής με SMS σε αυτό το νούμερο.', phoneOk: 'Το έλεγξα: το νούμερο είναι σωστό και δέχεται SMS.', phoneNeeded: 'Επιβεβαίωσε ότι το τηλέφωνό σου είναι σωστό.',
    waOrder: 'Αποστολή παραγγελίας στο WhatsApp', msgUs: 'Μήνυμα για αυτή την παραγγελία', tracking: 'Αριθμός αποστολής', track: 'Παρακολούθηση δέματος', copyNo: 'Αντιγραφή', boxCode: 'Το Box Now θα στείλει τον κωδικό παραλαβής στο {p} όταν το δέμα φτάσει στο locker.',
  },
};
let lang = localStorage.getItem('gewy:lang') || ((navigator.language || '').toLowerCase().startsWith('el') ? 'el' : 'en');
const t = (k, vars) => {
  let s = (DICT[lang] && DICT[lang][k]) ?? DICT.en[k] ?? k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll('{' + a + '}', b);
  return s;
};

/* ------------------------------------------------------------------- state */
const S = {
  tab: 'shop', products: [], settings: {}, orders: [], requests: [], threadRedraw: null, installEvt: null, entered: false,
  cart: JSON.parse(localStorage.getItem('gewy:cart') || '[]'),
  loaded: { products: false },
};
const saveCart = () => localStorage.setItem('gewy:cart', JSON.stringify(S.cart));
const profile = () => JSON.parse(localStorage.getItem('gewy:profile') || '{}');
const seenKey = (id) => 'gewy:seen:' + id;
const isUnread = (r) => r.lastFrom === 'admin' && (r.updatedAt || 0) > +(localStorage.getItem(seenKey(r.id)) || 0);
const digits = (s) => String(s || '').replace(/\D/g, '');
const activeCart = () => S.cart.filter((i) => !i.parked);
const cartCount = () => activeCart().reduce((n, i) => n + i.qty, 0);
const cartTotal = () => activeCart().reduce((n, i) => n + i.qty * i.price, 0);
// The shop's public contact details: what you typed in Admin > Settings, otherwise the ones in config.js.
const contact = () => ({ email: S.settings.contactEmail || CFG.contactEmail || '', phone: S.settings.phone || CFG.contactPhone || '' });
const termsData = () => ({ ...S.settings, contactEmail: contact().email, phone: contact().phone });
// Cart lines that need a stock check are parked (moved to the bottom) while sold out, and keep the shop's current price.
function syncCart() {
  if (!S.products.length) return;
  let ch = false;
  S.cart.forEach((i) => {
    if (!i.pid) return;
    const p = S.products.find((x) => x.id === i.pid);
    if (!p) { if (!i.parked) { i.parked = true; i.gone = true; ch = true; } return; }
    if (i.gone) { delete i.gone; ch = true; }
    if (lineOut(S.products, S.settings, i) && !i.parked) { i.parked = true; ch = true; }
    if (+p.price !== +i.price) { i.price = +p.price; ch = true; }
    if ((+p.cost || 0) !== (+i.cost || 0)) { i.cost = +p.cost || 0; ch = true; }
  });
  if (ch) saveCart();
}
const newCode = () => {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return 'GB-' + s;
};

const ORDER_CHIP = { new: 'blue', making: 'acc', ready: 'warn', delivered: 'ok', cancelled: 'bad' };
const REQ_CHIP = { new: 'blue', discussing: 'acc', quoted: 'warn', approved: 'ok', printing: 'acc', done: 'ok', closed: 'bad' };

/* ------------------------------------------------------------------- shell */
function shell() {
  const name = (S.settings.shopName || CFG.shopName || 'GEWY BUILDS').trim();
  const parts = name.split(' ');
  const last = parts.pop();
  const logo = `${esc(parts.join(' '))}${parts.length ? ' ' : ''}<b>${esc(last)}</b>`;
  $('#app').innerHTML = `
    <header class="top"><div class="wrap">
      <div class="logo grow"><svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="17" width="18" height="3" rx="1.5" fill="currentColor" opacity=".35"/><rect x="3" y="12" width="18" height="3" rx="1.5" fill="currentColor" opacity=".6"/><rect x="3" y="7" width="18" height="3" rx="1.5" fill="currentColor" opacity=".85"/><rect x="3" y="2" width="18" height="3" rx="1.5" style="fill:var(--acc)"/></svg><span>${logo}</span></div>
      <button class="iconbtn" data-act="theme" id="themeBtn" aria-label="Light or dark">${themeIcon()}</button>
      <button class="iconbtn mono" data-act="lang" aria-label="Language" style="font-size:13px;font-weight:700">${lang === 'el' ? 'EN' : 'ΕΛ'}</button>
      <button class="iconbtn${B.account() ? ' on' : ''}" data-act="account" aria-label="${esc(t('account'))}" id="accBtn">👤</button>
      ${B.pushAvailable ? '<button class="iconbtn" data-act="bell" aria-label="Notifications" id="bellBtn">🔔</button>' : ''}
      <button class="iconbtn" data-act="cart" aria-label="Cart">🛒<span class="dot hide" id="cartDot"></span></button>
    </div></header>
    <main class="wrap pad-nav" id="main"></main>
    <nav class="nav"><div class="wrap">
      <button data-act="tab" data-tab="shop"><span class="e">🧩</span>${esc(t('shop'))}</button>
      <button data-act="tab" data-tab="custom"><span class="e">✏️</span>${esc(t('custom'))}<i class="dot hide" id="dotCustom"></i></button>
      <button data-act="tab" data-tab="orders"><span class="e">📦</span>${esc(t('orders'))}</button>
      <button data-act="tab" data-tab="about"><span class="e">ℹ️</span>${esc(t('about'))}</button>
    </div></nav>`;
  document.documentElement.lang = lang;
  renderMain(true);
}

function bumpCart() {
  const b = $('[data-act=cart]');
  if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  try { navigator.vibrate && navigator.vibrate(8); } catch { /* ignore */ }
}

function updateChrome() {
  syncCart();
  const n = cartCount();
  const d = $('#cartDot');
  if (d) { d.textContent = n; d.classList.toggle('hide', !n); }
  $$('.nav [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
  const dc = $('#dotCustom');
  if (dc) dc.classList.toggle('hide', !S.requests.some(isUnread));
  const bell = $('#bellBtn');
  if (bell) bell.textContent = B.pushEnabled('shop') ? '🔔' : '🔕';
}

function renderMain(swap) {
  const m = $('#main');
  if (!m) return;
  document.body.dataset.bg = S.tab === 'shop' || S.tab === 'about' ? 'shop' : S.tab === 'custom' ? 'custom' : 'orders';
  if (swap) { m.classList.remove('swap'); void m.offsetWidth; m.classList.add('swap'); }
  if (S.tab === 'shop') m.innerHTML = viewShop();
  else if (S.tab === 'custom') m.innerHTML = viewCustom();
  else if (S.tab === 'about') m.innerHTML = viewAbout();
  else m.innerHTML = viewOrders();
  m.insertAdjacentHTML('beforeend', `<div class="mut sm" style="text-align:center;margin:26px 0 8px"><button class="linkbtn" data-act="legal" data-v="terms">${esc(t('terms'))}</button> · <button class="linkbtn" data-act="legal" data-v="privacy">${esc(t('privacy'))}</button></div>`);
  updateChrome();
}

/* -------------------------------------------------------------------- shop */
const isStandalone = () => (globalThis.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
function installBtn() {
  if (isStandalone()) return '';
  if (S.installEvt) return `<button class="btn pri sm" data-act="install">⬇ ${esc(t('install'))}</button>`;
  if (isIOS()) return `<button class="btn pri sm" data-act="iosInstall">⬇ ${esc(t('install'))}</button>`;
  return '';
}

function viewShop() {
  const st = S.settings;
  const pushOn = B.pushEnabled('shop');
  const nm = (profile().name || '').trim();
  let h = nm ? `<button class="hello" data-act="rename"><span class="wave">👋</span><span>${esc(greeting(lang, ''))}, <b>${esc(nm)}</b></span></button>` : '';
  h += `<section class="hero"><h2>${esc(t('heroTitle'))}</h2><div class="mut">${esc(st.about || t('heroSub'))}</div>
    ${installBtn() || B.pushAvailable ? '<div class="gap-s"></div>' : ''}
    <div class="row" style="flex-wrap:wrap">${installBtn()}
    ${!B.pushAvailable ? '' : pushOn ? `<span class="chip ok">🔔 ${esc(t('notifyOn'))}</span>` : `<button class="btn pri sm" data-act="bell">🔔 ${esc(t('notifyBtn'))}</button>`}</div>
  </section>`;
  if (B.mode === 'demo') h += `<div class="banner demo">🧪 <span><b>DEMO MODE</b> — data is saved only in this browser. See README to go live.</span></div>`;
  h += `<div class="gap"></div>`;
  if (!S.loaded.products) return h + '<div class="grid">' + '<div class="prod skel"><div class="ph"></div><div class="meta"><i></i><i class="s"></i></div></div>'.repeat(6) + '</div>';
  if (S.busy && !S.products.length) return h + `<div class="card">${esc(t('busyShop'))}</div>${contactButtons()}`;
  if (!S.products.length) return h + `<div class="empty">${esc(t('noProducts'))}</div>`;
  const enter = !S.entered; S.entered = true;
  h += `<div class="grid${enter ? ' enter' : ''}">` + S.products.map(prodCard).join('') + `</div>`;
  h += `<p class="mut sm" style="text-align:center;margin:22px 0 6px">${esc(t('trust'))}</p>`;
  return h;
}

const priceHtml = (p) => (wasPrice(p) ? `<s class="was">${eur(wasPrice(p))}</s> ` : '') + eur(p.price);
function prodCard(p) {
  const img = p.images && p.images[0];
  const fresh = Date.now() - (p.createdAt || 0) < 72 * 3600 * 1000;
  const sk = stockOf(p, S.settings);
  return `<button class="prod${sk.out ? ' oos' : ''}" data-act="open" data-id="${esc(p.id)}">
    <div class="ph">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">` : '<div class="noimg">🧩</div>'}</div>
    ${sk.out ? `<span class="chip bad tag">${esc(t('soldOut'))}</span>` : sk.low ? `<span class="chip warn tag">${esc(t('lowStock'))}</span>` : fresh ? `<span class="chip acc tag">${esc(t('new'))}</span>` : ''}
    ${wasPrice(p) && !sk.out ? `<span class="chip acc off">−${pctOff(p)}%</span>` : ''}
    <div class="meta"><div class="nm">${esc(p.name)}</div><div class="pr">${priceHtml(p)}</div></div></button>`;
}

const productLink = (id) => new URL('./', location.href).href + 'index.html?p=' + encodeURIComponent(id) + '&src=share';
async function shareProduct(p) {
  const url = productLink(p.id);
  try { if (navigator.share) { await navigator.share({ title: p.name, text: p.name + ' · ' + eur(p.price), url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await copy(url); toast('🔗 ' + t('linkCopied')); } catch { toast(url, 6000); }
}

function openProduct(id) {
  const p = S.products.find((x) => x.id === id);
  if (!p) return;
  B.bumpStage(1);
  let qty = 1;
  let ctext = '';
  const cu = p.custom && p.custom.on ? p.custom : null;
  const cmax = cu ? Math.min(40, Math.max(1, +cu.max || 12)) : 0;
  const opts = optionsOf(p);
  let oi = opts.length ? Math.max(0, stockOf(p, S.settings).opts.findIndex((o) => !o.out)) : -1;
  const cur = () => (oi >= 0 ? opts[oi] : null);
  const s = sheet('');
  const draw = () => {
    const sk = stockOf(p, S.settings);
    const o = oi >= 0 ? sk.opts[oi] : null;
    const out = o ? o.out : sk.out;
    const low = o ? o.low : sk.low;
    const c = cur();
    const imgs = c && c.images && c.images.length ? c.images : p.images || [];
    s.el.innerHTML = `
    <div class="hd"><div class="ttl">${esc(p.name)}</div><button class="xbtn" data-close>✕</button></div>
    ${imgs.length ? `<div class="gal">${imgs.map((u) => `<img src="${esc(u)}" alt="" data-zoom>`).join('')}</div>` : ''}
    <div class="row between" style="margin-top:12px"><div class="mono" style="font-size:22px;color:var(--acc2);font-weight:800">${priceHtml(p)}${wasPrice(p) ? ` <span class="chip acc">−${pctOff(p)}%</span>` : ''}</div>${out ? `<span class="chip bad">${esc(t('soldOut'))}</span>` : low ? `<span class="chip warn">${esc(t('lowStock'))}</span>` : ''}</div>
    ${p.description ? `<p style="white-space:pre-wrap">${esc(p.description)}</p>` : ''}
    ${opts.length ? `<div class="h2">${esc(t('color'))}</div><div class="chips" id="cols">${opts.map((x, i) => `<button class="pill${i === oi ? ' on' : ''}${sk.opts[i].out ? ' off' : ''}" data-a="color" data-i="${i}">${esc(x.name)}${sk.opts[i].out ? ' · ' + esc(t('soldOut')) : ''}</button>`).join('')}</div>` : ''}
    ${cu && !out ? `<div class="h2">${esc(cu.label || t('yourText'))}${cu.required === false ? '' : ' *'}</div><input class="in" id="cust" maxlength="${cmax}" value="${esc(ctext)}" autocomplete="off"><div class="mut sm" style="margin-top:4px">${esc(t('maxLetters', { n: cmax }))}</div>` : ''}
    ${out ? `<div class="card" style="margin-top:12px"><b>⏳ ${esc(t('backSoon'))}</b><div class="mut sm" style="margin-top:4px">${esc(t('outNote'))}</div>
        <div class="gap-s"></div><button class="btn pri block" data-a="pre">🔔 ${esc(t('preorder'))}</button><p class="mut sm" style="margin:8px 0 0">${esc(t('preorderHint'))}</p></div>`
      : `<div class="gap"></div>
    <div class="row"><div class="qty"><button data-a="minus">−</button><span id="q">${qty}</span><button data-a="plus">+</button></div>
      <button class="btn grow" data-a="add">${esc(t('add'))}</button></div>
    <div class="gap-s"></div><button class="btn pri block" data-a="buy">${esc(t('buyNow'))}</button>`}
    <div class="gap-s"></div><button class="btn ghost block sm" data-a="share">🔗 ${esc(t('share'))}</button>`;
  };
  draw();
  const item = () => {
    const c = cur();
    const col = c ? c.name : '';
    const tx = cu ? ctext.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, cmax) : '';
    return { key: p.id + '|' + col + '|' + tx.toLowerCase(), pid: p.id, custom: tx, name: p.name + (col ? ' · ' + col : '') + (tx ? ' · “' + tx + '”' : ''), price: +p.price || 0, cost: +p.cost || 0, qty, color: col, image: (c && c.images && c.images[0]) || (p.images || [])[0] || '' };
  };
  s.el.addEventListener('input', (e) => { if (e.target.id === 'cust') ctext = e.target.value; });
  const needText = () => { if (cu && cu.required !== false && !item().custom) { toast(t('textNeeded', { l: cu.label || t('yourText') }), 4000); const i = $('#cust', s.el); if (i) i.focus(); return true; } return false; };
  s.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if ((a === 'add' || a === 'buy') && needText()) return;
    if (a === 'minus') { qty = Math.max(1, qty - 1); $('#q', s.el).textContent = qty; }
    if (a === 'plus') { qty = Math.min(20, qty + 1); $('#q', s.el).textContent = qty; }
    if (a === 'color') { oi = +b.dataset.i; draw(); }
    if (a === 'add') {
      B.bumpStage(2);
      const it = item();
      const ex = S.cart.find((c) => c.key === it.key);
      if (ex) { ex.qty += it.qty; delete ex.parked; delete ex.gone; } else S.cart.push(it);
      saveCart(); updateChrome(); bumpCart(); toast('✓ ' + t('added')); s.close();
    }
    if (a === 'buy') { B.bumpStage(2); s.close(); openCheckout({ items: [item()] }); }
    if (a === 'pre') { s.close(); openPreorder(p, cur()); }
    if (a === 'share') shareProduct(p);
  });
}

/* --------------------------------------------------------------- pre-order */
// A pre-order is a custom request tied to a sold-out product. It needs a (free) account, so I know who is asking.
function openPreorder(p, o) {
  if (!B.account()) { toast(t('needAccount'), 4500); return openAccount(); }
  if (reqToday() >= MAX_REQ_DAY) return toast(t('reqLimit', { n: MAX_REQ_DAY }), 4500);
  const prof = profile();
  const label = p.name + (o ? ' · ' + o.name : '');
  const s = sheet(`<div class="hd"><div class="ttl">${esc(t('preorder'))}</div><button class="xbtn" data-close>✕</button></div>
    <div class="card"><b>${esc(label)}</b><div class="mono mut sm">${priceHtml(p)}</div></div>
    <p class="mut sm">${esc(t('preorderHint'))}</p>
    <div class="two"><label class="f"><span>${esc(t('qty'))}</span><input class="in" id="pQ" type="number" min="1" max="20" value="1" inputmode="numeric"></label>
    <label class="f"><span>${esc(t('area'))} *</span><select class="in" id="pA">${areaOpts(allAreas(), prof.area)}</select></label></div>
    <label class="f"><span>${esc(t('yourName'))}</span><input class="in" id="pN" value="${esc(prof.name || '')}"></label>
    <label class="f"><span>${esc(t('phone'))}</span><input class="in" id="pP" type="tel" value="${esc(prof.phone || '')}"></label>
    <label class="f"><span>${esc(t('note'))}</span><input class="in" id="pM"></label>
    ${agreeBox()}
    <div class="gap"></div><button class="btn pri block" data-a="send">${esc(t('preorder'))}</button>`);
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a=send]');
    if (!b) return;
    const name = $('#pN', s.el).value.trim();
    const phone = $('#pP', s.el).value.trim();
    const area = $('#pA', s.el).value;
    const note = $('#pM', s.el).value.trim();
    const q = Math.min(20, Math.max(1, parseInt($('#pQ', s.el).value, 10) || 1));
    if (reqToday() >= MAX_REQ_DAY) return toast(t('reqLimit', { n: MAX_REQ_DAY }), 4500);
    if (!area) return toast(t('areaNeeded'));
    if (!$('#agree', s.el).checked) return toast(t('agreeNeeded'));
    if (!name || digits(phone).length < 6) return toast(t('fillRequired'));
    b.disabled = true;
    try {
      const now = Date.now();
      const img = (o && o.images && o.images[0]) || (p.images || [])[0] || '';
      const id = await B.add('requests', {
        ownerUid: B.uid(), name, phone, area, title: (t('preorder') + ': ' + label).slice(0, 120),
        desc: `${t('preorder')}: ${label}\n${t('qty')}: ${q}${note ? '\n' + note : ''}`, budget: '', refImages: img ? [img] : [],
        status: 'new', quote: null, createdAt: now, updatedAt: now, lastFrom: 'customer', kind: 'preorder', pid: p.id, option: (o ? o.name : '').slice(0, 60),
      });
      localStorage.setItem('gewy:profile', JSON.stringify({ ...prof, name, phone, area }));
      localStorage.setItem(seenKey(id), String(now));
      B.bumpStage(4); B.touchDevice({ visit: false, area });
      s.close(); toast('✓ ' + t('preorderSent'));
      S.tab = 'custom'; renderMain(true);
      openThread(id);
    } catch (err) {
      console.error(err); b.disabled = false;
      if (isBusyErr(err)) { s.close(); openBusy(`${t('preorder')}: ${label} x${q}\n${name} · ${phone}\n${area}`); } else toast(t('err'));
    }
  });
}

/* ----------------------------------------------------------------- account */
// Optional. Guests can do everything except pre-order. An account keeps orders and requests on any phone.
function openAccount() {
  let mode = 'login';
  const s = sheet('');
  const fail = (e) => toast(t('e_' + ((e && e.key) || 'err')), 4500);
  const refreshBtn = () => { const x = $('#accBtn'); if (x) x.classList.toggle('on', !!B.account()); };
  const draw = () => {
    const a = B.account();
    if (a) {
      s.el.innerHTML = `<div class="hd"><div class="ttl">👤 ${esc(t('account'))}</div><button class="xbtn" data-close>✕</button></div>
        <div class="card"><div class="mut sm">${esc(t('loggedAs'))}</div><b>${esc(a.email)}</b>
          <div class="chips" style="margin-top:8px"><span class="chip ${a.verified ? 'ok' : 'warn'}">${esc(a.verified ? t('verified') : t('notVerified'))}</span></div>
          ${a.verified ? '' : `<div class="gap-s"></div><button class="btn sm block" data-a="resend">${esc(t('resend'))}</button>`}</div>
        <p class="mut sm">${esc(t('accWhy'))}</p>
        <button class="btn bad block" data-a="out">${esc(t('logout'))}</button>`;
      return;
    }
    const su = mode === 'signup';
    s.el.innerHTML = `<div class="hd"><div class="ttl">👤 ${esc(t('account'))}</div><button class="xbtn" data-close>✕</button></div>
      <p class="mut sm">${esc(t('accOptional'))} ${esc(t('accWhy'))}</p>
      <div class="chips"><button class="pill${su ? '' : ' on'}" data-a="mode" data-v="login">${esc(t('login'))}</button><button class="pill${su ? ' on' : ''}" data-a="mode" data-v="signup">${esc(t('signup'))}</button></div>
      <div class="gap-s"></div>
      <label class="f"><span>${esc(t('email'))}</span><input class="in" id="aE" type="email" autocomplete="email" inputmode="email"></label>
      <label class="f"><span>${esc(t('password'))}</span><input class="in" id="aP" type="password" autocomplete="${su ? 'new-password' : 'current-password'}"></label>
      <button class="btn pri block" data-a="go">${esc(su ? t('signup') : t('login'))}</button>
      ${su ? '' : `<div class="gap-s"></div><button class="linkbtn" data-a="forgot">${esc(t('forgot'))}</button>`}`;
  };
  draw();
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'mode') { mode = b.dataset.v; draw(); }
    if (a === 'go') {
      const email = $('#aE', s.el).value.trim();
      const pw = $('#aP', s.el).value;
      b.disabled = true;
      try {
        if (mode === 'signup') {
          await B.signUp(email, pw);
          toast('✓ ' + t('accDone'), 4000);
          B.heartbeat({ force: true, area: profile().area || '' });
          refreshBtn(); draw();
          if (S.tab === 'orders') renderMain();
        } else {
          await B.signIn(email, pw);
          toast('✓', 1500);
          setTimeout(() => location.reload(), 450);
        }
      } catch (err) { fail(err); b.disabled = false; }
    }
    if (a === 'forgot') {
      const email = ($('#aE', s.el).value || '').trim();
      if (!email) return toast(t('typeEmail'));
      try { await B.resetPassword(email); toast(t('resetSent'), 5000); } catch (err) { fail(err); }
    }
    if (a === 'resend') { try { await B.resendVerification(); toast(t('verifySent'), 4000); } catch (err) { fail(err); } }
    if (a === 'out') { try { await B.signOutAccount(); } catch (err) { console.error(err); } location.reload(); }
  });
}

/* -------------------------------------------------------------------- cart */
function openCart() {
  syncCart();
  const s = sheet('');
  const line = (i, n) => `<div class="line">
          ${i.image ? `<img src="${esc(i.image)}" alt="">` : '<div class="sq"></div>'}
          <div class="grow"><b>${esc(i.name)}</b><div class="mono mut sm">${eur(i.price)} × ${i.qty}</div></div>
          <div class="qty"><button data-a="m" data-n="${n}">−</button><span>${i.qty}</span><button data-a="p" data-n="${n}">+</button></div>
          <button class="xbtn" data-a="rm" data-n="${n}" aria-label="${esc(t('remove'))}">🗑</button></div>`;
  const parkedLine = (i, n) => {
    const back = !i.gone && !lineOut(S.products, S.settings, i);
    return `<div class="line oosl">
          ${i.image ? `<img src="${esc(i.image)}" alt="">` : '<div class="sq"></div>'}
          <div class="grow"><b>${esc(i.name)}</b><div class="mono mut sm">${eur(i.price)} × ${i.qty}</div>
            <div style="margin-top:4px">${back ? `<span class="chip ok">${esc(t('cartBack'))}</span>` : `<span class="chip bad">${esc(i.gone ? t('gone') : t('cartOut'))}</span>`}</div></div>
          ${back ? `<button class="btn sm pri" data-a="un" data-n="${n}">${esc(t('cartAddAgain'))}</button>` : ''}
          <button class="xbtn" data-a="rm" data-n="${n}" aria-label="${esc(t('remove'))}">🗑</button></div>`;
  };
  const draw = () => {
    const act = S.cart.map((i, n) => [i, n]).filter(([i]) => !i.parked);
    const park = S.cart.map((i, n) => [i, n]).filter(([i]) => i.parked);
    s.el.innerHTML = `<div class="hd"><div class="ttl">${esc(t('cart'))}</div><button class="xbtn" data-close>✕</button></div>
      ${act.length ? act.map(([i, n]) => line(i, n)).join('') +
        `<div class="row between" style="margin:14px 0"><span class="mut">${esc(t('total'))}</span><b class="mono" style="font-size:22px">${eur(cartTotal())}</b></div>
         <button class="btn pri block" data-a="go">${esc(t('checkout'))}</button>`
        : `<div class="empty">${esc(S.cart.length ? t('cartNothing') : t('cartEmpty'))}</div>`}
      ${park.length ? `<div class="h2" style="margin-top:20px">${esc(t('cartOut'))}</div>${park.map(([i, n]) => parkedLine(i, n)).join('')}` : ''}`;
  };
  draw();
  s.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const n = +b.dataset.n;
    if (b.dataset.a === 'm') S.cart[n].qty = Math.max(1, S.cart[n].qty - 1);
    if (b.dataset.a === 'p') S.cart[n].qty = Math.min(20, S.cart[n].qty + 1);
    if (b.dataset.a === 'rm') S.cart.splice(n, 1);
    if (b.dataset.a === 'un') { delete S.cart[n].parked; delete S.cart[n].gone; syncCart(); }
    if (b.dataset.a === 'go') { s.close(); openCheckout({ items: activeCart().map((x) => ({ ...x })), fromCart: true }); return; }
    saveCart(); updateChrome(); draw();
  });
}

/* ---------------------------------------------------------------- checkout */
const r2 = (n) => Math.round(n * 100) / 100;
// Box Now: part now (your cost, or a percentage), the rest when the parcel is in the locker.
function boxSplit(items, st) {
  const sub = items.reduce((n, i) => n + i.price * i.qty, 0);
  const fee = Math.max(0, +st.boxFee || 0);
  const cost = items.reduce((n, i) => n + (i.cost || 0) * i.qty, 0);
  const pct = Math.min(100, Math.max(5, +st.depositPct || 30));
  let dep = st.depositMode === 'percent' || cost <= 0 ? sub * pct / 100 : cost;
  dep = r2(Math.min(sub + fee, Math.max(1, dep)));
  const total = r2(sub + fee);
  return { fee, total, deposit: dep, balance: r2(total - dep) };
}

function openCheckout({ items, requestId = null, fromCart = false }) {
  B.bumpStage(3);
  const st = S.settings;
  let total = items.reduce((n, i) => n + i.price * i.qty, 0);
  const itemsTotal = total;
  const prof = profile();
  let via = ['whatsapp', 'viber', 'both', 'sms'].includes(prof.via) ? prof.via : 'whatsapp';
  const canOnline = st.payOnline !== false && !!st.payLink;
  const canHandoff = st.payHandoff !== false || !canOnline;
  let pay = canHandoff ? 'handoff' : 'online';
  const boxOn = !!st.boxnow && canOnline;
  let delivery = 'deliver';
  const label = st.payLabel || 'Card / PayPal / Revolut';

  const s = sheet(`
    <div class="hd"><div class="ttl">${esc(t('checkout'))}</div><button class="xbtn" data-close>✕</button></div>
    ${items.map((i) => `<div class="line">${i.image ? `<img src="${esc(i.image)}" alt="">` : '<div class="sq"></div>'}
      <div class="grow"><b>${esc(i.name)}</b><div class="mono mut sm">× ${i.qty}</div></div><b class="mono">${eur(i.price * i.qty)}</b></div>`).join('')}
    <div class="row between" style="margin:10px 0 4px"><span class="mut">${esc(t('total'))}</span><b class="mono" style="font-size:22px" id="totalV">${eur(total)}</b></div>
    <div class="card hide" id="boxSum"></div>
    <label class="f"><span>${esc(t('area'))} *</span><select class="in" id="cArea">${areaOpts(areasFor('deliver'), prof.area)}</select></label>
    <p class="mut sm" id="areaHint" style="margin:-6px 0 8px">${esc(t('areaHint'))}</p>
    <label class="f"><span>${esc(t('yourName'))}</span><input class="in" id="cName" autocomplete="name" value="${esc(prof.name || '')}"></label>
    <label class="f"><span>${esc(t('phone'))}</span><input class="in" id="cPhone" type="tel" autocomplete="tel" value="${esc(prof.phone || '')}" placeholder="${esc(t('phoneHint'))}"></label>
    <div class="h2">${esc(t('via'))}</div>
    <div class="chips" id="viaRow">${[['whatsapp', 'viaWa'], ['viber', 'viaViber'], ['both', 'viaBoth'], ['sms', 'viaSms']].map(([v, k]) => `<button type="button" class="pill${via === v ? ' on' : ''}" data-a="via" data-v="${v}">${esc(t(k))}</button>`).join('')}</div>
    <p class="mut sm" style="margin:6px 0 8px">${esc(t('viaHint'))}</p>
    <p class="mut sm hide" id="phoneHint" style="margin:-6px 0 8px">📱 ${esc(t('phoneBoxHint'))}</p>
    <label class="check hide" id="phoneOkW"><input type="checkbox" id="phoneOk"><span class="sm">${esc(t('phoneOk'))}</span></label>
    <div class="h2">${esc(t('how'))}</div>
    <div class="opt on" data-a="dl" data-v="deliver"><i class="rd"></i><div><b>${esc(t('deliver'))}</b><span class="mut sm">${esc(t('deliverDesc'))}</span></div></div>
    <div class="opt" data-a="dl" data-v="meetup"><i class="rd"></i><div><b>${esc(t('meetup'))}</b><span class="mut sm">${esc(t('meetupDesc'))}</span></div></div>
    ${boxOn ? `<div class="opt" data-a="dl" data-v="boxnow"><i class="rd"></i><div><b>📦 ${esc(t('boxnow'))}</b><span class="mut sm">${esc(t('boxnowDesc'))}</span></div></div>` : ''}
    <label class="f"><span id="addrL">${esc(t('address'))}</span><input class="in" id="cAddr" autocomplete="street-address" value="${esc(prof.address || '')}"></label>
    <label class="f"><span>${esc(t('note'))}</span><input class="in" id="cNote"></label>
    <div id="paySec"><div class="h2">${esc(t('payHow'))}</div>
    ${canHandoff ? `<div class="opt${pay === 'handoff' ? ' on' : ''}" data-a="pay" data-v="handoff"><i class="rd"></i><div><b>${esc(t('payHandoff'))}</b><span class="mut sm">${esc(st.handoffNote || t('payHandoffDesc'))}</span></div></div>` : ''}
    ${canOnline ? `<div class="opt${pay === 'online' ? ' on' : ''}" data-a="pay" data-v="online"><i class="rd"></i><div><b>${esc(t('payOnline'))}</b><span class="mut sm">${esc(t('payOnlineDesc', { label }))}</span></div></div>` : ''}</div>
    ${agreeBox()}
    <div class="gap"></div>
    <button class="btn pri block" data-a="place" id="placeBtn">${esc(t('placeOrder'))} · ${eur(total)}</button>
    <p class="mut sm" style="text-align:center">${esc(t('trust'))}</p>`);

  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'dl') {
      delivery = b.dataset.v;
      $$('[data-a=dl]', s.el).forEach((x) => x.classList.toggle('on', x === b));
      $('#addrL', s.el).textContent = delivery === 'deliver' ? t('address') : delivery === 'boxnow' ? t('boxWhere') : t('meetWhere');
      const box = delivery === 'boxnow';
      $('#phoneHint', s.el).classList.toggle('hide', !box);
      $('#phoneOkW', s.el).classList.toggle('hide', !box);
      const cur = $('#cArea', s.el).value;
      $('#cArea', s.el).innerHTML = areaOpts(areasFor(delivery), cur);
      $('#areaHint', s.el).textContent = box ? t('areaHintBox') : t('areaHint');
      $('#paySec', s.el).classList.toggle('hide', box);
      const sum = $('#boxSum', s.el);
      sum.classList.toggle('hide', !box);
      if (box) {
        const x = boxSplit(items, st);
        total = x.total;
        sum.innerHTML = `${x.fee ? `<div class="row between"><span class="mut">${esc(t('fee'))}</span><b class="mono">${eur(x.fee)}</b></div>` : ''}
          <div class="row between"><span>${esc(t('deposit'))}</span><b class="mono">${eur(x.deposit)}</b></div>
          <div class="row between"><span>${esc(t('balance'))}</span><b class="mono">${eur(x.balance)}</b></div>
          <p class="mut sm" style="margin:8px 0 0">${esc(t('boxExplain'))}</p>`;
      } else total = itemsTotal;
      $('#totalV', s.el).textContent = eur(total);
      $('#placeBtn', s.el).textContent = `${t('placeOrder')} · ${eur(total)}`;
    }
    if (a === 'via') {
      via = b.dataset.v;
      $$('[data-a=via]', s.el).forEach((x) => x.classList.toggle('on', x === b));
    }
    if (a === 'pay') {
      pay = b.dataset.v;
      $$('[data-a=pay]', s.el).forEach((x) => x.classList.toggle('on', x === b));
    }
    if (a === 'place') {
      const name = $('#cName', s.el).value.trim();
      const phone = $('#cPhone', s.el).value.trim();
      const address = $('#cAddr', s.el).value.trim();
      const note = $('#cNote', s.el).value.trim();
      const area = $('#cArea', s.el).value;
      if (!area) return toast(t('areaNeeded'));
      if (!$('#agree', s.el).checked) return toast(t('agreeNeeded'));
      if (!name || digits(phone).length < 6) return toast(t('fillRequired'));
      if (delivery !== 'meetup' && !address) return toast(t('needAddress'));
      if (delivery === 'boxnow' && !$('#phoneOk', s.el).checked) return toast(t('phoneNeeded'));
      b.disabled = true;
      try {
        // Last look at the stock and the prices, so nobody pays for something that just sold out.
        const chk = await freshCheck(items);
        if (chk.gone.length || chk.changed) {
          s.close(); applyFresh(chk);
          if (chk.gone.length) { toast(t('soldWhile', { n: chk.gone.map((i) => i.name).join(', ') }), 6500); if (fromCart) openCart(); }
          else { toast(t('priceChanged'), 5000); openCheckout({ items: items.map((i) => ({ ...i, price: chk.price(i) })), requestId, fromCart }); }
          return;
        }
        const bx = delivery === 'boxnow' ? boxSplit(items, st) : null;
        const order = {
          uid: B.uid(), no: newCode(),
          items: items.map((i) => ({ id: i.pid || null, name: i.name, price: i.price, cost: i.cost || 0, qty: i.qty, color: i.color || '', ...(i.custom ? { custom: String(i.custom).slice(0, 40) } : {}), image: i.image || '' })),
          total: bx ? bx.total : Math.round(total * 100) / 100,
          ...(bx ? { fee: bx.fee, deposit: bx.deposit, balance: bx.balance } : {}),
          costTotal: Math.round(items.reduce((n, i) => n + (i.cost || 0) * i.qty, 0) * 100) / 100,
          customer: { name, phone, address, note, area, via },
          delivery, payMethod: bx ? 'deposit' : pay, payStatus: 'unpaid', status: 'new',
          requestId, source: 'shop', createdAt: Date.now(),
        };
        const id = await B.add('orders', order);
        localStorage.setItem('gewy:profile', JSON.stringify({ name, phone, address, area, via }));
        B.touchDevice({ visit: false, area });
        if (requestId) {
          await B.add('messages', { requestId, ownerUid: B.uid(), from: 'customer', text: `✅ ${t('approve')} — ${order.no}`, at: Date.now() });
          await B.set('requests', requestId, { status: 'approved', updatedAt: Date.now(), lastFrom: 'customer' });
        }
        if (fromCart) { S.cart = S.cart.filter((i) => i.parked); saveCart(); updateChrome(); }
        B.bumpStage(4);
        s.close();
        showPlaced({ ...order, id });
      } catch (err) {
        console.error(err);
        b.disabled = false;
        if (isBusyErr(err)) {
          s.close();
          openBusy(`Order: ${items.map((i) => `${i.name} x${i.qty}`).join(', ')}\nTotal: ${eur(total)}\n${name} · ${phone}\n${area}${address ? ' · ' + address : ''}`);
        } else toast(t('err'));
      }
    }
  });
}

// Reads the newest stock and prices straight from the shop (a few tiny reads), right before an order is saved.
async function freshCheck(items) {
  const res = { gone: [], changed: false, st: null, prods: [], price: (i) => i.price };
  const pidItems = items.filter((i) => i.pid);
  if (!pidItems.length) return res;
  try {
    const st = (await B.getOne('settings', 'shop')) || S.settings;
    const pids = [...new Set(pidItems.map((i) => i.pid))];
    const prods = (await Promise.all(pids.map((id) => B.getOne('products', id)))).filter(Boolean);
    res.st = st; res.prods = prods;
    pidItems.forEach((i) => {
      const p = prods.find((x) => x.id === i.pid);
      if (!p || p.published === false || lineOut(prods, st, i)) res.gone.push(i);
      else if (Math.abs((+p.price || 0) - (+i.price || 0)) > 0.005) res.changed = true;
    });
    res.price = (i) => { const p = prods.find((x) => x.id === i.pid); return p ? +p.price : i.price; };
  } catch (e) { console.warn('stock check skipped', e.code || e); }
  return res;
}
function applyFresh(chk) {
  if (!chk.st) return;
  S.settings = chk.st;
  chk.prods.forEach((np) => { const k = S.products.findIndex((x) => x.id === np.id); if (k >= 0) S.products[k] = np; });
  syncCart(); updateChrome(); renderMain();
}

function payUrl(order) {
  const st = S.settings;
  return st.payLink ? fillPayLink(st.payLink, order.payMethod === 'deposit' ? { ...order, total: order.deposit } : order) : '';
}

function contactButtons() {
  const ph = contact().phone;
  if (!ph) return '';
  return `<div class="row" style="margin-top:10px"><a class="btn sm grow" href="tel:${esc(ph.replace(/[^\d+]/g, ''))}">📞 ${esc(t('call'))}</a>
    <a class="btn sm grow" target="_blank" rel="noopener" href="https://wa.me/${waNumber(ph)}">💬 ${esc(t('whatsapp'))}</a></div>`;
}

function showPlaced(o) {
  const url = o.payMethod === 'online' || o.payMethod === 'deposit' ? payUrl(o) : '';
  const dep = o.payMethod === 'deposit';
  const s = sheet(`
    <div style="text-align:center;padding:10px 0 4px"><svg class="tick" viewBox="0 0 52 52" width="64" height="64" aria-hidden="true"><circle class="tick-c" cx="26" cy="26" r="24" fill="none" stroke="var(--ok)" stroke-width="3"/><path class="tick-p" d="M15 27l8 8 14-16" fill="none" stroke="var(--ok)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="h1" style="margin:6px 0">${esc(t('orderPlaced'))}</div>
      <div class="mut sm">${esc(t('orderNo'))}</div><div class="mono" style="font-size:26px;font-weight:800;color:var(--acc2)">${esc(o.no)}</div></div>
    ${url ? `<div class="card" style="margin-top:12px"><div class="row between"><span class="mut">${esc(t('payAmount'))}</span><b class="mono" style="font-size:22px">${eur(dep ? o.deposit : o.total)}</b></div>
        ${dep ? `<div class="row between" style="margin-top:6px"><span class="mut">${esc(t('balLeft'))}</span><b class="mono">${eur(o.balance)}</b></div><p class="mut sm" style="margin:8px 0 0">${esc(t('depNote'))}</p>` : ''}
        <p class="mut sm" style="margin:8px 0 12px">${esc(t('payNote'))}</p>
        <a class="btn pri block" href="${esc(url)}" rel="noopener">💳 ${esc(t('payNow'))} · ${eur(dep ? o.deposit : o.total)}</a>
        <p class="mut sm" style="margin:10px 0 0">${esc(t('savedInOrders'))}</p></div>`
      : `<div class="card" style="margin-top:12px">${esc(t('handoffThanks'))}</div>`}
    ${orderWaUrl(o) ? `<a class="btn block" style="margin-top:10px" target="_blank" rel="noopener" href="${esc(orderWaUrl(o))}">💬 ${esc(t('waOrder'))}</a>` : ''}
    ${contactButtons()}
    <div class="gap"></div><button class="btn block" data-close>${esc(t('done'))}</button>`);
  try { navigator.vibrate && navigator.vibrate([12, 40, 12]); } catch { /* ignore */ }
  S.tab = 'orders';
  renderMain(true);
  return s;
}

/* ------------------------------------------------------------------ orders */
const STEPS = ['new', 'making', 'ready', 'delivered'];
const stepsHtml = (o) => {
  if (o.status === 'cancelled') return '';
  const at = STEPS.indexOf(o.status);
  return `<div class="steps">${STEPS.map((k, i) => `<div class="stp${i < at || (i === at && k === 'delivered') ? ' done' : i === at ? ' now' : ''}"><i>${i < at || (i === at && k === 'delivered') ? '✓' : i + 1}</i><span>${esc(t('st_' + k))}</span></div>`).join('')}</div>`;
};
const trackUrl = (o) => (/^https:\/\//i.test(S.settings.trackUrl || '') ? String(S.settings.trackUrl).replaceAll('{id}', encodeURIComponent(o.tracking)) : 'https://boxnow.gr/en');
function orderWaUrl(o) {
  const c = contact();
  if (!c.phone) return '';
  const cu = o.customer || {};
  const txt = `${t('orderNo')}: ${o.no}\n${(o.items || []).map((i) => `${i.name} × ${i.qty}`).join('\n')}\n${t('total')}: ${eur(o.total)}\n${cu.name || ''} · ${cu.phone || ''}${cu.area ? '\n' + cu.area : ''}`;
  return `https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(txt)}`;
}
function viewOrders() {
  const rows = [...S.orders].sort((a, b) => b.createdAt - a.createdAt);
  if (!rows.length) return `<div class="h1">${esc(t('orders'))}</div><div class="empty">${esc(t('noOrders'))}</div>`;
  const nudge = B.account() ? '' : `<div class="banner">👤 <span class="grow">${esc(t('accNudge'))}</span><button class="btn sm pri" data-act="account">${esc(t('signup'))}</button></div><div class="gap"></div>`;
  return `<div class="h1">${esc(t('orders'))}</div>${nudge}` + rows.map((o) => {
    const dep = o.payMethod === 'deposit';
    const url = (o.payMethod === 'online' ? o.payStatus !== 'paid' : dep && o.payStatus === 'unpaid') && o.status !== 'cancelled' ? payUrl(o) : '';
    const wa = orderWaUrl(o);
    return `<div class="card">
      <div class="row between"><b class="mono">${esc(o.no)}</b><span class="chip ${ORDER_CHIP[o.status] || ''}">${esc(t('st_' + o.status))}</span></div>
      <div class="mut sm">${esc(ago(o.createdAt, lang))}</div>
      ${stepsHtml(o)}
      <div style="margin:8px 0">${o.items.map((i) => `${esc(i.name)} × ${i.qty}`).join('<br>')}</div>
      <div class="row between"><b class="mono">${eur(o.total)}</b>
        <span class="chip ${o.payStatus === 'paid' ? 'ok' : 'warn'}">${esc(o.payStatus === 'paid' ? t('paid') : o.payStatus === 'deposit' ? t('depPaid') : o.payMethod === 'handoff' ? t('atHandoff') : t('unpaid'))}</span></div>
      ${dep && o.payStatus !== 'paid' ? `<div class="mut sm" style="margin-top:4px">${esc(t('balLeft'))}: <b class="mono">${eur(o.payStatus === 'deposit' ? o.balance : o.total)}</b></div>` : ''}
      ${o.tracking ? `<div class="card" style="margin-top:10px;padding:10px"><div class="mut sm">${esc(t('tracking'))}</div>
        <div class="row between" style="gap:8px;flex-wrap:wrap"><b class="mono">${esc(o.tracking)}</b><span class="row" style="gap:6px"><button class="btn sm" data-act="copyTrack" data-v="${esc(o.tracking)}">${esc(t('copyNo'))}</button><a class="btn sm pri" target="_blank" rel="noopener" href="${esc(trackUrl(o))}">${esc(t('track'))}</a></span></div></div>` : ''}
      ${o.delivery === 'boxnow' && !['delivered', 'cancelled'].includes(o.status) ? `<p class="mut sm" style="margin:8px 0 0">📱 ${esc(t('boxCode', { p: (o.customer && o.customer.phone) || '' }))}</p>` : ''}
      ${url ? `<a class="btn pri block" style="margin-top:10px" href="${esc(url)}" rel="noopener">💳 ${esc(t('payNow'))} · ${eur(dep ? o.deposit : o.total)}</a>` : ''}
      ${wa ? `<a class="btn sm block" style="margin-top:8px" target="_blank" rel="noopener" href="${esc(wa)}">💬 ${esc(t('msgUs'))}</a>` : ''}
    </div>`;
  }).join('') + contactButtons();
}

/* ------------------------------------------------------------------- about */
function viewAbout() {
  const st = S.settings, c = contact();
  const hand = areasFor('deliver'), cour = areasFor('boxnow');
  const btns = [
    c.phone ? `<a class="btn sm grow" style="white-space:nowrap" target="_blank" rel="noopener" href="https://wa.me/${waNumber(c.phone)}">💬 ${esc(t('whatsapp'))}</a>` : '',
    c.phone ? `<a class="btn sm grow" style="white-space:nowrap" href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ''))}">📞 ${esc(t('call'))}</a>` : '',
    c.email ? `<a class="btn sm grow" style="white-space:nowrap" href="mailto:${esc(c.email)}">✉️ ${esc(t('aboutEmail'))}</a>` : '',
  ].join('');
  return `<div class="h1">${esc(t('aboutH'))}</div>
    <div class="card" style="white-space:pre-wrap">${esc(st.aboutStory || t('aboutDefault'))}</div>
    <div class="h2">${esc(t('aboutContact'))}</div>
    <div class="card">${c.phone ? `<div class="mono">📞 ${esc(c.phone)}</div>` : ''}${c.email ? `<div class="mono">✉️ ${esc(c.email)}</div>` : ''}
      <div class="row" style="flex-wrap:wrap;margin-top:10px">${btns}</div></div>
    <div class="h2">${esc(t('aboutHow'))}</div>
    <div class="card" style="white-space:pre-line">${esc(t('aboutHowText'))}</div>
    <div class="h2">${esc(t('aboutAreas'))}</div>
    <div class="card"><b>🚚 ${esc(t('aboutHand'))}</b><div class="mut sm">${esc(hand.join(' · '))}</div>
      ${st.boxnow ? `<div class="sep" style="margin:10px 0"></div><b>📦 ${esc(t('aboutCourier'))}</b><div class="mut sm">${esc(cour.join(' · '))}</div>` : ''}</div>`;
}

/* ------------------------------------------------------------------ custom */
function viewCustom() {
  const rows = [...S.requests].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return `<section class="hero"><h2>${esc(t('customTitle'))}</h2><div class="mut">${esc(t('customSub'))}</div>
      <div class="gap-s"></div><button class="btn pri" data-act="newreq">✏️ ${esc(t('newReq'))}</button></section>
    <div class="gap"></div>` +
    (rows.length ? rows.map((r) => `<button class="card prod" style="padding:14px" data-act="thread" data-id="${esc(r.id)}">
        <div class="row between"><b>${esc(r.title)}</b><span class="chip ${REQ_CHIP[r.status] || ''}">${esc(t('rq_' + r.status))}</span></div>
        <div class="mut sm">${esc(ago(r.updatedAt, lang))}${isUnread(r) ? ' · <span style="color:var(--acc2)">●</span>' : ''}</div></button>`).join('')
      : `<div class="empty">${esc(t('noReqs'))}</div>`);
}

const areasFor = (kind) => (kind === 'boxnow' ? parseAreas(S.settings.courierAreas, COURIER_DEF) : parseAreas(S.settings.handoffAreas, HANDOFF_DEF));
const allAreas = () => [...new Set([...areasFor('x'), ...areasFor('boxnow')])];
const areaOpts = (list, cur) => `<option value="">${esc(t('chooseArea'))}</option>` + list.map((a) => `<option value="${esc(a)}"${a === cur ? ' selected' : ''}>${esc(a)}</option>`).join('');
function openLegal(kind) {
  const html = kind === 'terms' ? termsHtml(lang, termsData()) : privacyHtml(lang, termsData());
  sheet(`<div class="hd"><div class="ttl">${esc(t(kind))}</div><button class="xbtn" data-close>✕</button></div><div>${html}</div>
    <div class="gap"></div><button class="btn block" data-close>${esc(t('done'))}</button>`, { full: true });
}
const TERMS_V = '2';
const hasAgreed = () => !!localStorage.getItem('gewy:agreed') && localStorage.getItem('gewy:termsv') === TERMS_V;
const ownBox = () => `<label class="check"><input type="checkbox" id="own"><span class="sm">${esc(t('ownIt'))}</span></label>`;
const agreeBox = () => `<label class="check"><input type="checkbox" id="agree"${hasAgreed() ? ' checked' : ''}><span class="sm">${esc(t('agree'))} (<button type="button" class="linkbtn" data-act="legal" data-v="terms">${esc(t('terms'))}</button> · <button type="button" class="linkbtn" data-act="legal" data-v="privacy">${esc(t('privacy'))}</button>)</span></label>`;
const MAX_REQ_DAY = 3;
const reqToday = () => S.requests.filter((r) => (r.createdAt || 0) > Date.now() - 86400000).length;

function openNewRequest() {
  if (reqToday() >= MAX_REQ_DAY) return toast(t('reqLimit', { n: MAX_REQ_DAY }), 4500);
  const prof = profile();
  const files = [];
  const s = sheet(`
    <div class="hd"><div class="ttl">${esc(t('newReq'))}</div><button class="xbtn" data-close>✕</button></div>
    <label class="f"><span>${esc(t('reqTitle'))}</span><input class="in" id="rT" placeholder="${esc(t('reqTitleP'))}"></label>
    <label class="f"><span>${esc(t('reqDesc'))}</span><textarea class="in" id="rD" placeholder="${esc(t('reqDescP'))}"></textarea></label>
    <label class="f"><span>${esc(t('reqBudget'))}</span><input class="in" id="rB"></label>
    <label class="f"><span>${esc(t('area'))} *</span><select class="in" id="rArea">${areaOpts(allAreas(), prof.area)}</select></label>
    <div class="h2">${esc(t('reqPhoto'))}</div>
    <div class="thumbs" id="rTh"><button class="addimg" data-a="pick">＋</button></div>
    <input type="file" id="rF" accept="image/*" multiple class="hide">
    <label class="f"><span>${esc(t('yourName'))}</span><input class="in" id="rN" value="${esc(prof.name || '')}"></label>
    <label class="f"><span>${esc(t('phone'))}</span><input class="in" id="rP" type="tel" value="${esc(prof.phone || '')}"></label>
    ${ownBox()}
    ${agreeBox()}
    <div class="gap"></div><button class="btn pri block" data-a="send">${esc(t('sendReq'))}</button>`);
  const drawThumbs = () => {
    $('#rTh', s.el).innerHTML = files.map((f, i) => `<div class="thumb"><img src="${URL.createObjectURL(f)}" alt=""><button data-a="x" data-i="${i}">✕</button></div>`).join('') +
      (files.length < B.MAX_PHOTOS ? '<button class="addimg" data-a="pick">＋</button>' : '');
  };
  $('#rF', s.el).addEventListener('change', (e) => { files.push(...[...e.target.files].slice(0, B.MAX_PHOTOS - files.length)); e.target.value = ''; drawThumbs(); });
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'pick') $('#rF', s.el).click();
    if (b.dataset.a === 'x') { files.splice(+b.dataset.i, 1); drawThumbs(); }
    if (b.dataset.a === 'send') {
      const title = $('#rT', s.el).value.trim();
      const desc = $('#rD', s.el).value.trim();
      const name = $('#rN', s.el).value.trim();
      const phone = $('#rP', s.el).value.trim();
      if (reqToday() >= MAX_REQ_DAY) return toast(t('reqLimit', { n: MAX_REQ_DAY }), 4500);
      if (!title || !desc) return toast(t('reqTitle'));
      const area = $('#rArea', s.el).value;
      if (!area) return toast(t('areaNeeded'));
      if (!$('#own', s.el).checked) return toast(t('ownNeeded'));
      if (!$('#agree', s.el).checked) return toast(t('agreeNeeded'));
      if (!name || digits(phone).length < 6) return toast(t('fillRequired'));
      b.disabled = true; b.textContent = t('sending');
      try {
        const refImages = [];
        for (const f of files) refImages.push(await B.uploadImage(f, 'requests/' + B.uid()));
        const now = Date.now();
        const id = await B.add('requests', { ownerUid: B.uid(), name, phone, area, title, desc, budget: $('#rB', s.el).value.trim(), refImages, status: 'new', quote: null, createdAt: now, updatedAt: now, lastFrom: 'customer' });
        localStorage.setItem('gewy:profile', JSON.stringify({ ...prof, name, phone, area }));
        localStorage.setItem(seenKey(id), String(now));
        B.bumpStage(4);
        s.close(); toast('✓ ' + t('sent'));
        openThread(id);
      } catch (err) {
        console.error(err); b.disabled = false; b.textContent = t('sendReq');
        if (isBusyErr(err)) { s.close(); openBusy(`Custom request: ${title}\n${desc}\n${name} · ${phone}\n${area}`); } else toast(t('err'));
      }
    }
  });
}

function openThread(id) {
  const s = sheet(`<div class="hd"><div class="ttl" id="tTitle"></div><span id="tChip"></span><button class="xbtn" data-close>✕</button></div>
    <div id="tInfo"></div><div class="chat" id="tChat"></div>
    <div class="composer"><button class="iconbtn" data-a="att" aria-label="Photo">📷</button><input type="file" id="tF" accept="image/*" class="hide">
      <textarea id="tM" rows="1" placeholder="${esc(t('msgP'))}"></textarea><button class="btn pri" data-a="send">${esc(t('send'))}</button></div>`,
    { full: true, onClose: () => { un1(); S.threadRedraw = null; localStorage.setItem(seenKey(id), String(Date.now())); updateChrome(); renderMain(); } });
  let msgs = [];
  const getReq = () => S.requests.find((r) => r.id === id);
  const drawInfo = () => {
    const r = getReq();
    if (!r) return;
    $('#tTitle', s.el).textContent = r.title;
    $('#tChip', s.el).innerHTML = `<span class="chip ${REQ_CHIP[r.status] || ''}">${esc(t('rq_' + r.status))}</span>`;
    let h = `<div class="card"><div class="mut sm">${esc(t('details'))}</div><div style="white-space:pre-wrap">${esc(r.desc)}</div>
      ${r.budget ? `<div class="mut sm" style="margin-top:6px">${esc(t('reqBudget'))}: ${esc(r.budget)}</div>` : ''}
      ${(r.refImages || []).length ? `<div class="thumbs">${r.refImages.map((u) => `<div class="thumb"><img src="${esc(u)}" data-zoom alt=""></div>`).join('')}</div>` : ''}</div>`;
    if (r.quote && r.status === 'quoted') {
      h += `<div class="card" style="border-color:var(--acc);margin-top:10px"><div class="row between"><span>${esc(t('quoteReady'))}</span><b class="mono" style="font-size:22px">${eur(r.quote.price)}</b></div>
        ${r.quote.note ? `<div class="mut sm" style="margin-top:4px">${esc(r.quote.note)}</div>` : ''}
        <div class="gap-s"></div><button class="btn pri block" data-a="approve">✅ ${esc(t('approve'))} · ${eur(r.quote.price)}</button>
        <p class="mut sm" style="margin:8px 0 0">${esc(t('quoteHint'))}</p></div>`;
    }
    $('#tInfo', s.el).innerHTML = h;
  };
  const drawChat = () => {
    const box = $('#tChat', s.el);
    const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = [...msgs].sort((a, b) => a.at - b.at).map((m) => `<div class="bub${m.from === 'customer' ? ' me' : ''}">
      ${m.image ? `<img src="${esc(m.image)}" data-zoom alt="">` : ''}${m.text ? esc(m.text) : ''}<div class="t">${esc(m.from === 'customer' ? t('you') : t('maker'))} · ${esc(ago(m.at, lang))}</div></div>`).join('');
    if (atEnd) box.scrollTop = box.scrollHeight;
    localStorage.setItem(seenKey(id), String(Date.now()));
  };
  const un1 = B.watch('messages', (rows) => { msgs = rows; drawChat(); }, { where: [['requestId', '==', id], ['ownerUid', '==', B.uid()]] });
  S.threadRedraw = drawInfo; // the main requests listener calls this when the request changes
  drawInfo();
  const send = async (image) => {
    const ta = $('#tM', s.el);
    const text = ta.value.trim();
    if (!text && !image) return;
    ta.value = '';
    const now = Date.now();
    await B.add('messages', { requestId: id, ownerUid: B.uid(), from: 'customer', text, image: image || '', at: now });
    await B.set('requests', id, { updatedAt: now, lastFrom: 'customer' });
  };
  $('#tF', s.el).addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { toast(t('sending')); await send(await B.uploadImage(f, 'requests/' + B.uid())); } catch (err) { console.error(err); toast(t('err')); }
  });
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'att') $('#tF', s.el).click();
    if (b.dataset.a === 'send') { try { await send(); } catch (err) { console.error(err); toast(t('err')); } }
    if (b.dataset.a === 'approve') {
      const r = getReq();
      s.close();
      openCheckout({ items: [{ key: 'req' + id, pid: null, name: '✏️ ' + r.title, price: +r.quote.price, cost: 0, qty: 1, image: (r.refImages || [])[0] || '' }], requestId: id });
    }
  });
  $('#tM', s.el).addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 700) { e.preventDefault(); send(); } });
}

/* ----------------------------------------------------------- notifications */
async function bell() {
  if (B.pushEnabled('shop')) return toast('🔔 ' + t('notifyOn'));
  if (!('Notification' in globalThis)) return sheet(`<div class="hd"><div class="ttl">🔔</div><button class="xbtn" data-close>✕</button></div><p>${esc(t('notifyIos'))}</p><button class="btn block" data-close>OK</button>`);
  const r = await B.enablePush('shop');
  if (r.ok) toast('🔔 ' + t('notifyThanks'));
  else if (r.reason === 'denied') toast(t('notifyDenied'), 5000);
  else toast(t('notifyIos'), 6000);
  renderMain();
}

async function installApp() {
  const ev = S.installEvt;
  if (!ev) return;
  try { ev.prompt(); await ev.userChoice; } catch { /* ignore */ }
  S.installEvt = null;
  renderMain();
}
globalThis.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installEvt = e; if (S.tab === 'shop') renderMain(); });
globalThis.addEventListener('appinstalled', () => { S.installEvt = null; toast('✓ ' + t('installDone')); B.touchDevice({ installed: true, visit: false }); renderMain(); });

/* ------------------------------------------------------------------ events */
document.addEventListener('click', (e) => {
  const z = e.target.closest('img[data-zoom]');
  if (z) { sheet(`<img src="${esc(z.src)}" alt="" style="width:100%;border-radius:14px"><div class="gap-s"></div><button class="btn block" data-close>✕</button>`); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act;
  if (a === 'tab') { S.tab = b.dataset.tab; renderMain(true); scrollTo(0, 0); }
  if (a === 'open') openProduct(b.dataset.id);
  if (a === 'cart') openCart();
  if (a === 'bell') bell();
  if (a === 'install') installApp();
  if (a === 'iosInstall') sheet(`<div class="hd"><div class="ttl">${esc(t('installTitle'))}</div><button class="xbtn" data-close>✕</button></div><p style="white-space:pre-wrap">${esc(t('installSteps'))}</p><button class="btn block" data-close>OK</button>`);
  if (a === 'lang') { lang = lang === 'el' ? 'en' : 'el'; localStorage.setItem('gewy:lang', lang); shell(); }
  if (a === 'newreq') openNewRequest();
  if (a === 'legal') openLegal(b.dataset.v);
  if (a === 'rename') startOnboarding(['name']);
  if (a === 'theme') { setTheme(getTheme() === 'light' ? 'dark' : 'light'); b.textContent = themeIcon(); }
  if (a === 'thread') openThread(b.dataset.id);
  if (a === 'account') openAccount();
  if (a === 'copyTrack') { copy(b.dataset.v); toast('✓ ' + b.dataset.v); }
});
globalThis.addEventListener('gewy:push', (e) => toast('🔔 ' + [e.detail.title, e.detail.body].filter(Boolean).join(' — '), 6000));

/* ------------------------------------------------------------ welcome (first open) */
const todayKey = () => new Date().toISOString().slice(0, 10);
function startOnboarding(only) {
  const prof = profile();
  const steps = only || [...(localStorage.getItem('gewy:ob') ? [] : ['name', 'src']), ...(hasAgreed() ? [] : ['consent'])];
  if (!steps.length) return false;
  startWelcome({
    steps, name: prof.name || '', getLang: () => lang, openLegal,
    setLang: (l) => { lang = l; localStorage.setItem('gewy:lang', l); shell(); },
    onFinish: ({ name, src }) => {
      try {
        if (steps.includes('consent')) { localStorage.setItem('gewy:agreed', String(Date.now())); localStorage.setItem('gewy:termsv', TERMS_V); }
        if (steps.includes('name') || steps.includes('src')) localStorage.setItem('gewy:ob', '1');
        if (name && name.trim()) localStorage.setItem('gewy:profile', JSON.stringify({ ...profile(), name: name.trim() }));
        if (src) { localStorage.setItem('gewy:src', src); B.touchDevice({ visit: false, src }); }
        localStorage.setItem('gewy:hello', todayKey());
      } catch { /* ignore */ }
      renderMain(true);
      openDeep();
    },
  });
  return true;
}
function dailyHello() {
  const nm = (profile().name || '').trim();
  if (!nm || localStorage.getItem('gewy:hello') === todayKey()) return;
  try { localStorage.setItem('gewy:hello', todayKey()); } catch { /* ignore */ }
  setTimeout(() => toast(welcomeBack(lang, nm), 3600), 600);
}

/* ------------------------------------------------------ busy / saved catalogue */
const isBusyErr = (e) => ['resource-exhausted', 'unavailable', 'deadline-exceeded'].includes(e && e.code);
function openBusy(message) {
  const ph = contact().phone;
  const s = sheet(`<div class="hd"><div class="ttl">${esc(t('busyTitle'))}</div><button class="xbtn" data-close>✕</button></div>
    <p class="mut">${esc(t('busyText'))}</p>
    <div class="card sm" style="white-space:pre-wrap">${esc(message)}</div><div class="gap-s"></div>
    ${ph ? `<a class="btn pri block" target="_blank" rel="noopener" href="https://wa.me/${waNumber(ph)}?text=${encodeURIComponent(message)}">💬 ${esc(t('busyWA'))}</a><div class="gap-s"></div>` : ''}
    <button class="btn block" data-a="copy">${esc(t('busyCopy'))}</button>`);
  s.el.addEventListener('click', (e) => { if (e.target.closest('[data-a=copy]')) { copy(message); toast('✓'); } });
}
const CAT_TTL = 10 * 60 * 1000;
// Products are saved on the phone for 10 minutes, but stock switches (filaments) must show up fast: the settings document is only one tiny read.
async function refreshSettings() {
  try {
    const st = await B.getOne('settings', 'shop');
    if (!st) return;
    S.setAt = Date.now(); S.settings = st;
    const c = await cacheGet('catalog');
    // The admin stamps catRev whenever a product is saved, hidden or deleted: if our saved copy is older, load the products again now.
    if (c && (st.catRev || 0) > (c.rev || 0)) { loadCatalog(true); return; }
    if (c) { c.settings = st; cacheSet('catalog', c); }
    syncCart(); updateChrome();
    if (S.tab === 'shop' || S.tab === 'about') renderMain();
  } catch (e) { console.warn('settings refresh skipped', e.code || e); }
}
// A shared product link (?p=...) opens that product once the shop is ready.
function openDeep() {
  if (!S.deep || document.querySelector('.ob') || !S.loaded.products) return;
  const id = S.deep; S.deep = '';
  if (S.products.some((x) => x.id === id)) openProduct(id);
}
async function loadCatalog(force) {
  const apply = (c) => {
    S.products = (c.products || []).filter((p) => p.published !== false).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    S.settings = c.settings || {};
    S.loaded.products = true;
    syncCart(); updateChrome();
    if (S.tab === 'shop' || S.tab === 'about') renderMain();
    openDeep();
  };
  const cached = await cacheGet('catalog');
  if (cached) { S.catAt = cached.at; S.setAt = cached.at; apply(cached); if (!force && Date.now() - cached.at < CAT_TTL) { refreshSettings(); return; } }
  try {
    const [products, settings] = await Promise.all([B.getAll('products'), B.getOne('settings', 'shop')]);
    const c = { at: Date.now(), rev: (settings && settings.catRev) || 0, products, settings: settings || {} };
    S.catAt = c.at; S.setAt = c.at; S.busy = false;
    cacheSet('catalog', c);
    apply(c);
  } catch (err) {
    console.warn('catalog load failed', err.code || err);
    if (!cached) { S.loaded.products = true; S.busy = true; if (S.tab === 'shop') renderMain(); }
  }
}

/* -------------------------------------------------------------------- boot */
(async function boot() {
  try { S.deep = (new URLSearchParams(location.search).get('p') || '').slice(0, 60); } catch { S.deep = ''; }
  shell();
  if (!startOnboarding()) dailyHello();
  try {
    await B.init({ role: 'shop' });
  } catch (err) {
    console.error(err);
    $('#main').innerHTML = `<div class="empty">${esc(t('err'))}</div>`;
    return;
  }
  const me = B.uid();
  { const ab = $('#accBtn'); if (ab) ab.classList.toggle('on', !!B.account()); }
  if (B.mode === 'demo') {
    B.watch('products', (rows) => {
      S.loaded.products = true;
      S.products = rows.filter((p) => p.published !== false).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      syncCart(); updateChrome();
      if (S.tab === 'shop') renderMain();
      openDeep();
    });
    B.watchDoc('settings', 'shop', (d) => { S.settings = d || {}; syncCart(); updateChrome(); if (S.tab === 'shop' || S.tab === 'about') renderMain(); });
  } else {
    loadCatalog();
    // Coming back to the app after a while: refresh the saved copy.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (Date.now() - (S.catAt || 0) > CAT_TTL) loadCatalog(true);
      else if (Date.now() - (S.setAt || S.catAt || 0) > 20 * 1000) refreshSettings();
    });
  }
  B.watch('orders', (rows) => { S.orders = rows; if (S.tab === 'orders') renderMain(); }, { where: [['uid', '==', me]] });
  B.watch('requests', (rows) => { S.requests = rows; if (S.tab === 'custom') renderMain(); updateChrome(); if (S.threadRedraw) S.threadRedraw(); }, { where: [['ownerUid', '==', me]] });
  if (B.mode === 'demo') {
    const started = Date.now();
    B.watch('broadcasts', (rows) => {
      rows.filter((r) => r.at >= started - 1500 && !sessionStorage.getItem('b:' + r.id)).forEach((r) => {
        sessionStorage.setItem('b:' + r.id, '1');
        toast('🔔 ' + r.title + (r.body ? ' — ' + r.body : ''), 6000);
        B.localNotify(r.title, r.body || '');
      });
    });
  }
  if (B.pushAvailable) B.enablePush('shop', { silent: true });
  // Audience stats: count this visit once per session (and note if it was opened from the home-screen icon).
  let counted = false;
  try { counted = !!sessionStorage.getItem('gewy:counted'); sessionStorage.setItem('gewy:counted', '1'); } catch { /* ignore */ }
  let link = '';
  try {
    link = (new URLSearchParams(location.search).get('src') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 30);
    if (link && !localStorage.getItem('gewy:link')) localStorage.setItem('gewy:link', link);
    link = localStorage.getItem('gewy:link') || '';
  } catch { /* ignore */ }
  if (!counted) B.touchDevice({ installed: isStandalone(), visit: true, src: localStorage.getItem('gewy:src') || '', link, area: profile().area || '' });
  // Logged-in customers: tell the admin "active now" at most every 5 minutes while the app is open.
  B.heartbeat({ force: true, area: profile().area || '' });
  setInterval(() => { if (!document.hidden) B.heartbeat({ area: profile().area || '' }); }, 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) B.heartbeat({ area: profile().area || '' }); });
})();
