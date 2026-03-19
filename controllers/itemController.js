import {db} from '../config/db.js';
import { items,users} from '../db/schema.js';
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';

const ITEMS_PER_PAGE = 9;

function getIcon(category) {
  const icons = {
    electronics : '📱',
    accessories : '👜',
    documents   : '📄',
    bags        : '🎒',
    keys        : '🔑',
    clothing    : '👕',
    jewelry     : '💍',
    other       : '📦',
  };
  return icons[category];
}

export const getBrowse = async (req, res) => {
  try {
    const {
      search   = '',
      category = '',
      type     = '',
      sort     = 'recent',
      page     = 1
    } = req.query;

    const conditions = [eq(items.status, 'active')];
    if (category) conditions.push(eq(items.category, category));
    if (type)     conditions.push(eq(items.type, type));

    const whereClause = search
      ? and(...conditions, or(
          like(items.name,        `%${search}%`),
          like(items.description, `%${search}%`),
          like(items.location,    `%${search}%`)
        ))
      : and(...conditions);

    const sortMap = {
      recent  : desc(items.createdAt),
      oldest  : asc(items.createdAt),
      location: asc(items.location),
    };

    const currentPage = Math.max(1, parseInt(page) || 1);
    const offset      = (currentPage - 1) * ITEMS_PER_PAGE;

    const [totalResult, rows] = await Promise.all([
      db.select({ count: count() }).from(items).where(whereClause),
      db.select().from(items)
        .where(whereClause)
        .orderBy(sortMap[sort] || sortMap.recent)
        .limit(ITEMS_PER_PAGE)
        .offset(offset),
    ]);

    const totalItems    = Number(totalResult[0].count);
    const totalPages    = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const itemsWithIcon = rows.map(item => ({ ...item, icon: getIcon(item.category) }));

    res.render('browse', {
      title      : 'Browse Items',
      items      : itemsWithIcon,
      currentPage,
      totalPages,
      totalItems,
      filters    : { search, category, type, sort }
    });

  } catch (err) {
    console.error('getBrowse error:', err.message);
    res.render('browse', {
      title      : 'Browse Items',
      items      : [],
      currentPage: 1,
      totalPages : 0,
      totalItems : 0,
      filters    : {}
    });
  }
};

export const getItemDetail = async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
    const item   = result[0];

    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/browse');
    }

    // Fetch the owner of this item
    const userResult = await db.select().from(users).where(eq(users.id, item.userId)).limit(1);
    const owner      = userResult[0] || null;

    res.render('item-detail', {
      title: item.name,
      item : { ...item, icon: getIcon(item.category), user: owner }
    });

  } catch (err) {
    console.error('getItemDetail error:', err.message);
    req.flash('error', 'Item not found');
    res.redirect('/browse');
  }
};

//making a function for rendering home page
export const getHome = async (req, res) => {
  try {
    const recentItems = await db.select().from(items)
      .where(eq(items.status, 'active'))
      .orderBy(desc(items.createdAt))
      .limit(6);

    const itemsWithIcon = recentItems.map(item => ({
      ...item,
      icon: getIcon(item.category)
    }));

    res.render('index', { title: 'Home', recentItems: itemsWithIcon });

  } catch (err) {
    console.error('getHome error:', err.message);
    res.render('index', { title: 'Home', recentItems: [] });
  }
};

//making a func for getting itemreportpage
export const getReportLost = async (req, res) => {
  res.render('report-lost', {
    title  : 'Report Lost Item',
    editing: false,
    item   : {}
  });
};

export const postReportLost=async(req,res)=>{
	try {
		 const {name, category, location, date, time,description, contactMethod, reward} = req.body;
    // insert new lost item into the database
    await db.insert(items).values({
      type          : 'lost',
      name,
      category,
      location,
      date          : new Date(date),
      time          : time || '',
      description,
      contactMethod : contactMethod || 'email',
      reward        : parseFloat(reward) || 0,
      userId        : res.locals.currentUser.id,
      userName      : res.locals.currentUser.name,
    });
	req.flash('success', 'Lost item reported successfully!');
    res.redirect('/dashboard');
	} catch (error) {
	console.error('postReportLost error:', error.message);
    req.flash('error', 'Failed to report item. Please try again.');
    res.redirect('/report-lost');
	}
}

//making a func for getreportfound page
export const getReportFound = async (req, res) => {
  res.render('report-found', {
    title  : 'Report Found Item',
    editing: false,
    item   : {}
  });
};

//making a func for stroing the reportfound items details in the Database
export const postReportFound=async(req,res)=>{
	try {
		  const {name, category, location, date, time,description, contactMethod, currentLocation,
			otherLocation, hasIdentification, urgentReturn, damagedItem} = req.body;

        // if currentLocation is "other", use the otherLocation text input
    const finalLocation = currentLocation === 'other' ? (otherLocation || '') : currentLocation;
	   
	await db.insert(items).values({
      type             : 'found',
      name,
      category,
      location,
      date             : new Date(date),
      time             : time || '',
      description,
      contactMethod    : contactMethod || 'email',
      currentLocation  : finalLocation,
      // checkboxes return 'on' if checked, undefined if not
      hasIdentification: hasIdentification === 'on',
      urgentReturn     : urgentReturn === 'on',
      damagedItem      : damagedItem === 'on',
      userId           : res.locals.currentUser.id,         // replace with res.locals.currentUser.id after login is built
      userName         : res.locals.currentUser.name, // replace with res.locals.currentUser.name after login is built
    });

    req.flash('success', 'Found item reported successfully!');
    res.redirect('/dashboard');
	} catch (error) {
		console.error('postReportFound error:', error.message);
        req.flash('error', 'Failed to report item. Please try again.');
        res.redirect('/report-found');
	}
}


//making a func for dashboard route
export const getDashboard = async (req, res) => {
  try {
    const userId    = res.locals.currentUser.id;
    const userItems = await db.select().from(items).where(eq(items.userId, userId)).orderBy(desc(items.createdAt));

    const lostCount  = userItems.filter(i => i.type === 'lost').length;
    const foundCount = userItems.filter(i => i.type === 'found').length;
    const resolved   = userItems.filter(i => i.status === 'resolved').length;

    const userItemsWithIcon = userItems.map(item => ({ ...item, icon: getIcon(item.category) }));

    res.render('dashboard', {
      title    : 'Dashboard',
      userItems: userItemsWithIcon,
      stats    : { lostCount, foundCount, resolved }
    });

  } catch (err) {
    console.error('getDashboard error:', err.message);
    res.render('dashboard', { title: 'Dashboard', userItems: [], stats: { lostCount: 0, foundCount: 0, resolved: 0 } });
  }
};


//making a func for the getprofilepage

export const getprofile=async(req,res)=>{
	res.render("profile",{title:"My Profile"})
}

//creating a controller for the my lost items and my found items
export const getMyItems = async (req, res) => {
  try {
    const userId = res.locals.currentUser.id;
    const type   = req.query.type; // 'lost' or 'found'

    // build condition based on type
    const condition = type
      ? and(eq(items.userId, userId), eq(items.type, type))
      : eq(items.userId, userId);

    const userItems = await db.select().from(items)
      .where(condition)
      .orderBy(desc(items.createdAt));

    res.render('my-items', {
      title     : type === 'lost' ? 'My Lost Items' : type === 'found' ? 'My Found Items' : 'My Items',
      items     : userItems.map(item => ({ ...item, icon: getIcon(item.category) })),
      activeType: type || 'all'
    });

  } catch (err) {
    console.error('getMyItems error:', err.message);
    res.render('my-items', { title: 'My Items', items: [], activeType: 'all' });
  }
};


//creating a func for the marking resolve items and deleting the item in the my items page(my lost items/my found items)
export const deleteItem = async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (!item[0]) {
      req.flash('error', 'Item not found');
      return res.redirect('/my-items');
    }

    // only owner can delete
    if (item[0].userId !== res.locals.currentUser.id) {
      req.flash('error', 'Not authorized');
      return res.redirect('/my-items');
    }

    await db.delete(items).where(eq(items.id, id));

    req.flash('success', 'Item deleted successfully');
    res.redirect('/my-items?type=' + item[0].type); // redirects back to same page

  } catch (err) {
    console.error('deleteItem error:', err.message);
    req.flash('error', 'Failed to delete item');
    res.redirect('/my-items');
  }
};

export const resolveItem = async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (!item[0] || item[0].userId !== res.locals.currentUser.id) {
      req.flash('error', 'Not authorized');
      return res.redirect('/my-items');
    }

    await db.update(items).set({ status: 'resolved' }).where(eq(items.id, id));

    req.flash('success', 'Item marked as resolved!');
   res.redirect('/my-items?type=' + item[0].type);// redirects back to same page

  } catch (err) {
    console.error('resolveItem error:', err.message);
    req.flash('error', 'Failed to update item');
    res.redirect('/my-items');
  }
};

//creating a func for the editing of the reported item route

// GET /items/:id/edit - show pre-filled form
export const getEditItem = async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/my-items');
    }

    // only owner can edit
    if (item.userId !== res.locals.currentUser.id) {
      req.flash('error', 'Not authorized');
      return res.redirect('/my-items');
    }

    // render correct form based on item type
    if (item.type === 'lost') {
      res.render('report-lost', {
        title  : 'Edit Lost Item',
        item   : { ...item, icon: getIcon(item.category) },
        editing: true
      });
    } else {
      res.render('report-found', {
        title  : 'Edit Found Item',
        item   : { ...item, icon: getIcon(item.category) },
        editing: true
      });
    }

  } catch (err) {
    console.error('getEditItem error:', err.message);
    req.flash('error', 'Something went wrong');
    res.redirect('/my-items');
  }
};

// POST /items/:id/edit - update item in DB
export const postEditItem = async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (!item || item.userId !== res.locals.currentUser.id) {
      req.flash('error', 'Not authorized');
      return res.redirect('/my-items');
    }

    const {
      name, category, location, date, time,
      description, contactMethod, reward,
      currentLocation, otherLocation,
      hasIdentification, urgentReturn, damagedItem
    } = req.body;

    // if currentLocation is 'other' use otherLocation text
    const finalLocation = currentLocation === 'other' ? (otherLocation || '') : currentLocation;

    await db.update(items).set({
      name,
      category,
      location,
      date             : new Date(date),
      time             : time || '',
      description,
      contactMethod    : contactMethod || 'email',
      reward           : parseFloat(reward) || 0,
      currentLocation  : finalLocation || '',
      hasIdentification: hasIdentification === 'on',
      urgentReturn     : urgentReturn === 'on',
      damagedItem      : damagedItem === 'on',
    }).where(eq(items.id, id));

    req.flash('success', 'Item updated successfully!');
    res.redirect('/my-items?type=' + item.type);

  } catch (err) {
    console.error('postEditItem error:', err.message);
    req.flash('error', 'Failed to update item. Please try again.');
    res.redirect('/my-items');
  }
};

