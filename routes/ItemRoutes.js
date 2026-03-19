import { Router }        from 'express';
import * as itemControllers from '../controllers/itemController.js';
import { requireAuth } from '../middleware/authMiddlewares.js';


const router = Router();
 
// GET /browse — browse all items with filters + pagination
router.get('/browse', itemControllers.getBrowse);
 
// GET /items/:id — view a single item detail
router.get('/items/:id', itemControllers.getItemDetail);
 
//get home page
router.get("/",itemControllers.getHome)

//get the itemreportpage(login also required we will add later)
router.route("/report-lost").get(requireAuth,itemControllers.getReportLost).post(requireAuth,itemControllers.postReportLost)

//get the itemfoundpage(login will be added later)
router.route('/report-found').get(requireAuth,itemControllers.getReportFound).post(requireAuth,itemControllers.postReportFound);

//creating a dashboard route
router.get('/dashboard', requireAuth, itemControllers.getDashboard);

//creating a profile page route
router.get('/profile',itemControllers.getprofile);

//creating a route for MyLostItems and MyFoundItems
router.get('/my-items', requireAuth, itemControllers.getMyItems);

//creating a route for deleting the item and marking resolve in the my items page
router.post('/items/:id/delete',  requireAuth, itemControllers.deleteItem);
router.post('/items/:id/resolve', requireAuth, itemControllers.resolveItem);


//creating a route for the edit of the reported items
// edit item routes
router.route('/items/:id/edit').get(requireAuth, itemControllers.getEditItem).post(requireAuth, itemControllers.postEditItem);
export default router;