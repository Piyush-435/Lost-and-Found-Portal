import {db} from '../config/db.js';
import { items,users,matches} from '../db/schema.js';
import { eq, and, or, like, desc, asc, count ,ne} from 'drizzle-orm';
import { findAndSaveMatches } from '../services/matchingService.js';
import {itemVerificationQuestions, matchVerificationAttempts, connectionRequests } from '../db/schema.js';
import { sendConnectionNotification } from '../services/emailService.js';

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
    title        : 'Report Lost Item',
    editing      : false,
    item         : {},
    sourceFoundId: req.query.sourceFoundId || null
  });
};

export const postReportLost = async (req, res) => {
  try {
const { name, category, location, date, time, description, contactMethod, reward, sourceFoundId } = req.body;

// save lost item to DB
    const insertResult = await db.insert(items).values({
      type         : 'lost',
      name,
      category,
      location,
      date         : new Date(date),
      time         : time || '',
      description,
      contactMethod: contactMethod || 'email',
      reward       : parseFloat(reward) || 0,
      userId       : res.locals.currentUser.id,
      userName     : res.locals.currentUser.name,
    });
	
	// fetch the saved item so we can run matching on it
	const [savedItem] = await db.select().from(items)
	  .where(eq(items.id, insertResult[0].insertId))
	  .limit(1);

	//fetching the qns from item body
	const { question1, answer1, question2, answer2 } = req.body;
	//inserting the qsns into qsns table
	if (question1 || question2) {
		await db.insert(itemVerificationQuestions).values({
			itemId   : savedItem.id,
			userId   : res.locals.currentUser.id,
			question1: question1 || '',
			answer1  : answer1   || '',
			question2: question2 || '',
			answer2  : answer2   || '',
  		});
}

    // run matching against all active found items
    const matchCount = await findAndSaveMatches(savedItem);

    // show different message based on whether matches were found
    if (matchCount > 0) {
      req.flash('success', `Potential match found for your lost item. Check your dashboard for details.`);
    } else {
      req.flash('success', 'Report submitted successfully. No potential match found right now. We\'ll notify you if a match is found later.');
    }

    res.redirect('/dashboard');

  } catch (error) {
    console.error('postReportLost error:', error.message);
    req.flash('error', 'Failed to report item. Please try again.');
    res.redirect('/report-lost' + (sourceFoundId ? `?sourceFoundId=${sourceFoundId}` : ''));
  }
};


//controller for getReportFound
export const getReportFound = async (req, res) => {
  res.render('report-found', {
    title       : 'Report Found Item',
    editing     : false,
    item        : {},
    sourceLostId: req.query.sourceLostId || null
  });
};
//making a func for stroing the reportfound items details in the Database
export const postReportFound = async (req, res) => {
  try {
const {
  name, category, location, date, time, description,
  contactMethod, currentLocation, otherLocation,
  hasIdentification, urgentReturn, damagedItem, sourceLostId
} = req.body;

    const finalLocation = currentLocation === 'other' ? (otherLocation || '') : currentLocation;

    // save found item to DB
    const insertResult = await db.insert(items).values({
      type             : 'found',
      name,
      category,
      location,         
      date             : new Date(date),
      time             : time || '',
      description,
      contactMethod    : contactMethod || 'email',
      currentLocation  : finalLocation,
      hasIdentification: hasIdentification === 'on',
      urgentReturn     : urgentReturn === 'on',
      damagedItem      : damagedItem === 'on',
      userId           : res.locals.currentUser.id,
      userName         : res.locals.currentUser.name,
    });
	
	// fetch the saved item so we can run matching on it
	const [savedItem] = await db.select().from(items)
	  .where(eq(items.id, insertResult[0].insertId))
	  .limit(1);


		//fetching the qns from item body
	const { question1, answer1, question2, answer2 } = req.body;
	//inserting the qsns into qsns table
	if (question1 || question2) {
		await db.insert(itemVerificationQuestions).values({
			itemId   : savedItem.id,
			userId   : res.locals.currentUser.id,
			question1: question1 || '',
			answer1  : answer1   || '',
			question2: question2 || '',
			answer2  : answer2   || '',
  		});
}


    // run matching against all active lost items
    const matchCount = await findAndSaveMatches(savedItem);

    // show different message based on whether matches were found
    if (matchCount > 0) {
      req.flash('success', 'Potential match found. Your found report may match an existing lost item. Check your dashboard for details.');
    } else {
      req.flash('success', 'Report submitted successfully. No potential match found right now. We\'ll notify you if a match is found later.');
    }

    res.redirect('/dashboard');

  } catch (error) {
    console.error('postReportFound error:', error.message);
    req.flash('error', 'Failed to report item. Please try again.');
    res.redirect('/report-found' + (sourceLostId ? `?sourceLostId=${sourceLostId}` : ''));
  }
};


//making a func for dashboard route
export const getDashboard = async (req, res) => {
  try {
    const userId = res.locals.currentUser.id;

    // fetch user's items
    const userItems = await db.select().from(items)
      .where(eq(items.userId, userId))
      .orderBy(desc(items.createdAt));

    // calculate stats from fetched items
    const lostCount  = userItems.filter(i => i.type === 'lost').length;
    const foundCount = userItems.filter(i => i.type === 'found').length;
    const resolved   = userItems.filter(i => i.status === 'resolved').length;

    // fetch potential match count for this user
    const matchCountResult = await db.select({ count: count() }).from(matches)
      .where(and(
        eq(matches.status, 'potential'),
        or(
          eq(matches.lostUserId,  userId),
          eq(matches.foundUserId, userId)
        )
      ));

    const matchCount = Number(matchCountResult[0].count);

    const userItemsWithIcon = userItems.map(item => ({ ...item, icon: getIcon(item.category) }));

    res.render('dashboard', {
      title    : 'Dashboard',
      userItems: userItemsWithIcon,
      stats    : { lostCount, foundCount, resolved, matchCount }
    });

  } catch (err) {
    console.error('getDashboard error:', err.message);
    res.render('dashboard', {
      title    : 'Dashboard',
      userItems: [],
      stats    : { lostCount: 0, foundCount: 0, resolved: 0, matchCount: 0 }
    });
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

    // mark item as resolved — won't show in browse since browse filters active only
    await db.update(items).set({ status: 'resolved' }).where(eq(items.id, id));

    // fetch all matches for this item
    const relatedMatches = await db.select().from(matches)
      .where(or(
        eq(matches.lostItemId,  id),
        eq(matches.foundItemId, id)
      ));

    // delete matches — cascade automatically removes connectionRequests
    // and matchVerificationAttempts linked to these matches
    for (const match of relatedMatches) {
      await db.delete(matches).where(eq(matches.id, match.id));
    }

    req.flash('success', 'Item marked as resolved!');
    res.redirect('/my-items?type=' + item[0].type);

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

    // fetch updated item
    const [updatedItem] = await db.select().from(items)
      .where(eq(items.id, id))
      .limit(1);

    // delete old potential matches so scores get recalculated fresh
    if (item.type === 'lost') {
      await db.delete(matches).where(and(eq(matches.lostItemId, id), eq(matches.status, 'potential')));
    } else {
      await db.delete(matches).where(and(eq(matches.foundItemId, id), eq(matches.status, 'potential')));
    }

    // re-run matching with updated details
    await findAndSaveMatches(updatedItem);

    req.flash('success', 'Item updated successfully!');
    res.redirect('/my-items?type=' + item.type);

  } catch (err) {
    console.error('postEditItem error:', err.message);
    req.flash('error', 'Failed to update item. Please try again.');
    res.redirect('/my-items');
  }
};


//creating a controller for the potential matches 


export const getMatches = async (req, res) => {
  try {
    const userId = res.locals.currentUser.id;

    // fetch all potential matches where user is either the lost or found side
    const userMatches = await db.select().from(matches)
      .where(and(
        eq(matches.status, 'potential'),
        or(
          eq(matches.lostUserId,  userId),
          eq(matches.foundUserId, userId)
        )
      ))
      .orderBy(desc(matches.createdAt));

    res.render('matches', {
      title  : 'Potential Matches',
      matches: userMatches
    });

  } catch (err) {
    console.error('getMatches error:', err.message);
    res.render('matches', { title: 'Potential Matches', matches: [] });
  }
};

//controller for the onfirmMatch in potential Matches
export const confirmMatch = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(matches).set({ status: 'request_pending' }).where(eq(matches.id, id));
    req.flash('success', 'Match confirmed!');
    res.redirect('/matches');
  } catch (err) {
    console.error('confirmMatch error:', err.message);
    req.flash('error', 'Something went wrong.');
    res.redirect('/matches');
  }
};

//controller for the reject in potential matches
export const rejectMatch = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(matches).set({ status: 'request_rejected' }).where(eq(matches.id, id));
    req.flash('success', 'Match rejected.');
    res.redirect('/matches');
  } catch (err) {
    console.error('rejectMatch error:', err.message);
    req.flash('error', 'Something went wrong.');
    res.redirect('/matches');
  }
};


//creating a controller for the verifications qsns for the user
export const getVerify = async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const userId  = res.locals.currentUser.id;

    // fetch the match
    const [match] = await db.select().from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      req.flash('error', 'Match not found.');
      return res.redirect('/matches');
    }

    // make sure current user is part of this match
    if (match.lostUserId !== userId && match.foundUserId !== userId) {
      req.flash('error', 'Not authorized.');
      return res.redirect('/matches');
    }

    // check if max attempts reached (3)
    const [attemptRecord] = await db.select().from(matchVerificationAttempts)
      .where(and(
        eq(matchVerificationAttempts.matchId, matchId),
        eq(matchVerificationAttempts.userId,  userId)
      ))
      .limit(1);

    if (attemptRecord && attemptRecord.attempts >= 3) {
      req.flash('error', 'Maximum verification attempts reached for this match.');
      return res.redirect('/matches');
    }

    const attemptsLeft = attemptRecord ? 3 - attemptRecord.attempts : 3;

    // determine which item's questions to show
    // if current user is the lost item owner → show found item's questions
    // if current user is the found item owner → show lost item's questions
    const oppositeItemId = userId === match.lostUserId
      ? match.foundItemId
      : match.lostItemId;

    // fetch verification questions for the opposite item
    const [questions] = await db.select().from(itemVerificationQuestions)
      .where(eq(itemVerificationQuestions.itemId, oppositeItemId))
      .limit(1);

   if (!questions || (!questions.question1 && !questions.question2)) {
  // no questions set — skip verification and send connection request directly
  await db.insert(connectionRequests).values({
    matchId   : match.id,
    fromUserId: userId,
    toUserId  : userId === match.lostUserId ? match.foundUserId : match.lostUserId,
    status    : 'pending'
  });

  // update match status to request_pending
  await db.update(matches)
    .set({ status: 'request_pending' })
    .where(eq(matches.id, matchId));

  req.flash('success', 'No verification questions.Connection request sent. Please wait until the other user accepts.');
  return res.redirect('/matches');
}

    res.render('verify', {
      title       : 'Verify Ownership',
      match,
      questions,
      attemptsLeft
    });

  } catch (err) {
    console.error('getVerify error:', err.message);
    req.flash('error', 'Something went wrong.');
    res.redirect('/matches');
  }
};

//controller for the post verification
export const postVerify = async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const userId  = res.locals.currentUser.id;
    const { answer1, answer2 } = req.body;

    // fetch the match
    const [match] = await db.select().from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      req.flash('error', 'Match not found.');
      return res.redirect('/matches');
    }

    // make sure current user is part of this match
    if (match.lostUserId !== userId && match.foundUserId !== userId) {
      req.flash('error', 'Not authorized.');
      return res.redirect('/matches');
    }

    // fetch attempt record
    const [attemptRecord] = await db.select().from(matchVerificationAttempts)
      .where(and(
        eq(matchVerificationAttempts.matchId, matchId),
        eq(matchVerificationAttempts.userId,  userId)
      ))
      .limit(1);

    // block if already 3 attempts
    if (attemptRecord && attemptRecord.attempts >= 3) {
      req.flash('error', 'Maximum verification attempts reached for this match.');
      return res.redirect('/matches');
    }

    // determine opposite item id
    const oppositeItemId = userId === match.lostUserId
      ? match.foundItemId
      : match.lostItemId;

    // fetch correct answers
    const [questions] = await db.select().from(itemVerificationQuestions)
      .where(eq(itemVerificationQuestions.itemId, oppositeItemId))
      .limit(1);

    // compare answers — case insensitive and trimmed
    const ans1Correct = !questions.question1 ||
      (answer1 || '').trim().toLowerCase() === (questions.answer1 || '').trim().toLowerCase();

    const ans2Correct = !questions.question2 ||
      (answer2 || '').trim().toLowerCase() === (questions.answer2 || '').trim().toLowerCase();

    const passed = ans1Correct && ans2Correct;

    // update or create attempt record
    if (attemptRecord) {
      await db.update(matchVerificationAttempts)
        .set({ attempts: attemptRecord.attempts + 1 })
        .where(and(
          eq(matchVerificationAttempts.matchId, matchId),
          eq(matchVerificationAttempts.userId,  userId)
        ));
    } else {
      await db.insert(matchVerificationAttempts).values({
        matchId,
        userId,
        attempts: 1
      });
    }

    const newAttempts    = attemptRecord ? attemptRecord.attempts + 1 : 1;
    const attemptsLeft   = 3 - newAttempts;

    if (passed) {
      // update match status to request_pending
      await db.update(matches)
        .set({ status: 'request_pending' })
        .where(eq(matches.id, matchId));

      // create connection request
      await db.insert(connectionRequests).values({
        matchId,
        fromUserId: userId,
        toUserId  : userId === match.lostUserId ? match.foundUserId : match.lostUserId,
        status    : 'pending'
      });

      req.flash('success', 'Verification passed! Connection request sent. Please wait until the other user accepts.');
      return res.redirect('/matches');

    } else {
      // update match status to verification_failed
      await db.update(matches)
        .set({ status: 'verification_failed' })
        .where(eq(matches.id, matchId));

      if (attemptsLeft <= 0) {
        req.flash('error', 'Verification failed. Maximum attempts reached. You can no longer verify this match.');
        return res.redirect('/matches');
      }

      req.flash('error', `Verification failed. You have ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`);
      return res.redirect(`/matches/${matchId}/verify`);
    }

  } catch (err) {
    console.error('postVerify error:', err.message);
    req.flash('error', 'Something went wrong.');
    res.redirect('/matches');
  }
};


//making a controller for getting connection page
export const getConnections = async (req, res) => {
  try {
    const userId = res.locals.currentUser.id;

    // fetch all requests where user is either sender or receiver
    // so both sent and received requests appear on this page
    const allRequests = await db.select().from(connectionRequests)
      .where(or(
        eq(connectionRequests.fromUserId, userId),
        eq(connectionRequests.toUserId,   userId)
      ))
      .orderBy(desc(connectionRequests.createdAt));

    // for each request fetch match + opposite user details
    // Promise.all runs all fetches in parallel — faster than one by one
    const requestsWithDetails = await Promise.all(allRequests.map(async (request) => {

      // fetch the match this request belongs to
      const [match] = await db.select().from(matches)
        .where(eq(matches.id, request.matchId))
        .limit(1);

      // figure out who the opposite user is
      // if I am the sender → opposite is receiver, and vice versa
      const oppositeUserId = request.fromUserId === userId
        ? request.toUserId
        : request.fromUserId;

      // fetch opposite user's details from DB
      const [oppositeUser] = await db.select().from(users)
        .where(eq(users.id, oppositeUserId))
        .limit(1);

      return {
        ...request,           // spread all request fields
        match,                // attach match details
        oppositeUser: oppositeUser ? {
          id    : oppositeUser.id,
          name  : oppositeUser.name,
          email : oppositeUser.email,   // only shown if accepted
          phone : oppositeUser.phone,   // only shown if accepted
          avatar: oppositeUser.avatar,
        } : null,
        // isIncoming = true means this request was sent TO me
        // used in EJS to decide whether to show accept/reject buttons
        isIncoming: request.toUserId === userId,
      };
    }));

    res.render('connections', {
      title   : 'Connections',
      requests: requestsWithDetails
    });

  } catch (err) {
    console.error('getConnections error:', err.message);
    res.render('connections', { title: 'Connections', requests: [] });
  }
};

//making a controller for the accpetrequest
export const acceptRequest = async (req, res) => {
  try {
    // get connection request id from URL params e.g. /connections/5/accept → id = 5
    const id     = parseInt(req.params.id);
    const userId = res.locals.currentUser.id;

    // fetch the connection request from DB
    const [request] = await db.select().from(connectionRequests)
      .where(eq(connectionRequests.id, id))
      .limit(1);

    // if request not found or current user is not the receiver → block
    // only the receiver (toUserId) can accept — not the sender
    if (!request || request.toUserId !== userId) {
      req.flash('error', 'Not authorized.');
      return res.redirect('/connections');
    }

    // mark connection request as accepted
    await db.update(connectionRequests)
      .set({ status: 'accepted' })
      .where(eq(connectionRequests.id, id));

    // mark the match as fully connected
    await db.update(matches)
      .set({ status: 'connected' })
      .where(eq(matches.id, request.matchId));

    // fetch match details — needed for email content (item names)
    const [match] = await db.select().from(matches)
      .where(eq(matches.id, request.matchId))
      .limit(1);

    // fetch both users — needed to send emails to both
    const [fromUser] = await db.select().from(users)
      .where(eq(users.id, request.fromUserId))
      .limit(1);

    const [toUser] = await db.select().from(users)
      .where(eq(users.id, request.toUserId))
      .limit(1);

    // notify the sender (person who sent the request) that it was accepted
    await sendConnectionNotification({
      name            : fromUser.name,
      email           : fromUser.email,
      status          : 'accepted',
      oppositeUserName: toUser.name,
      lostItemName    : match.lostItemName,
      foundItemName   : match.foundItemName,
    });

    // notify the receiver (person who accepted) as confirmation
    await sendConnectionNotification({
      name            : toUser.name,
      email           : toUser.email,
      status          : 'accepted',
      oppositeUserName: fromUser.name,
      lostItemName    : match.lostItemName,
      foundItemName   : match.foundItemName,
    });

    req.flash('success', 'Connection approved! Both users have been notified via email.');
    res.redirect('/connections');

  } catch (err) {
    console.error('acceptRequest error:', err.message);
    req.flash('error', 'Something went wrong.');
    res.redirect('/connections');
  }
};

//making a route for the reject request 
export const rejectRequest = async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const userId = res.locals.currentUser.id;

    // fetch the connection request
    const [request] = await db.select().from(connectionRequests)
      .where(eq(connectionRequests.id, id))
      .limit(1);

    // only the receiver can reject — block if not authorized
    if (!request || request.toUserId !== userId) {
      req.flash('error', 'Not authorized.');
      return res.redirect('/connections');
    }

    // mark connection request as rejected
    await db.update(connectionRequests)
      .set({ status: 'rejected' })
      .where(eq(connectionRequests.id, id));

    // mark match status as request_rejected
    await db.update(matches)
      .set({ status: 'request_rejected' })
      .where(eq(matches.id, request.matchId));

    // fetch match and both users for email
    const [match]    = await db.select().from(matches)
      .where(eq(matches.id, request.matchId))
      .limit(1);

    const [fromUser] = await db.select().from(users)
      .where(eq(users.id, request.fromUserId))
      .limit(1);

    const [toUser]   = await db.select().from(users)
      .where(eq(users.id, request.toUserId))
      .limit(1);

    // only notify the sender — receiver already knows they rejected it
    await sendConnectionNotification({
      name            : fromUser.name,
      email           : fromUser.email,
      status          : 'rejected',
      oppositeUserName: toUser.name,
      lostItemName    : match.lostItemName,
      foundItemName   : match.foundItemName,
    });

    req.flash('success', 'Connection request rejected. The other user has been notified.');
    res.redirect('/connections');

  } catch (err) {
    console.error('rejectRequest error:', err.message);
    req.flash('error', 'Something went wrong.');
    res.redirect('/connections');
  }
};