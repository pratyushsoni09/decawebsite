# DecaCorpus Website - Hover, Animation & Interaction Report

Source file: DecaCorpus\_Build\_Whats\_Next.html | Pages: Home, Services, Work, Studio, Insights, Careers, Contact | Measured on a 1440 x 900 desktop with a mouse | Prepared 12 Oct 2026

## 1. How to read this report

Each page is documented on its own, after a section for behaviour that every page shares. Hover effects were verified by hovering the real elements in a browser and comparing their styles before and after. Animations, scroll effects, clicks, keyboard and drag behaviour were read from the stylesheet and script.

- **Trigger**: Load (plays when the page opens), Scroll, Hover, Click, Drag, Mouse move, Keyboard, or Auto (timer).
- **Timing** is given as duration and easing, for example 0.4s spring. The easing names are defined in section 2.
- Hover effects apply to mouse users. The custom cursor is drawn only on devices with a fine pointer (mouse or trackpad).
- With the operating-system setting "reduce motion" turned on, all animations and transitions are switched off, autoplay stops and the page transition is hidden.
- Pages are hash routes (for example #/services); moving between them plays the white page transition (section 3.5).

## 2. Motion system

### 2.1 Easing and timing vocabulary

| Name | Curve | Feel | Used for |
| --- | --- | --- | --- |
| Smooth-out | cubic-bezier(.2,.7,.1,1) | Fast start, long soft stop | Scroll reveals, card lifts, hero text, panels |
| Spring | cubic-bezier(.34,1.4,.5,1) | Small overshoot, then settles | Buttons, chips, list rows, FAQ, tags |
| Strong spring | cubic-bezier(.34,1.5-1.8,.5,1) | Clearer bounce | Menu button, round arrow button, sticker, dropdowns |
| Drawer spring | cubic-bezier(.22,1.1,.36,1) | Gentle overshoot | Service drawer |
| In-out | cubic-bezier(.7,0,.2,1) | Decisive, symmetrical | Page transition, text roll |
| Linear | linear | Constant speed | Marquees, progress bars, scan line |
| Ease-in-out | ease-in-out | Soft loop | Floating objects, ambient glow |

### 2.2 Recurring patterns

| Pattern | Where it is used | Behaviour |
| --- | --- | --- |
| Button hover (all buttons) | Every Start a Project, ghost, Apply, Next button | Lifts 2 px, fades to 78% opacity, arrow slides 5 px right, filled buttons gain a soft cream glow (0 10px 30px). Ghost buttons turn their outline from grey to cream. Pressing scales to 96%. Timing: 0.4s spring |
| Card lift | Service cards, article cards, culture and role cards | Moves up 3-6 px, border brightens, shadow appears. Timing: 0.35-0.45s smooth-out |
| Text roll | Nav links, footer links, menu links, email links in CTA bands | The label is duplicated; on hover the first copy slides up and out while the second slides in. Timing: 0.55s in-out |
| Scroll reveal | Almost every heading, panel and card | Fades in while rising 34 px (some items 0-40 px) as it enters the screen. Timing: 0.9s smooth-out, delayed 0.09s per sibling (max 0.45s) |
| Outline brighten | Chips, tags, filters, tiles | Border changes from #2a2a28 to cream. Timing: 0.25-0.35s |

## 3. Behaviour shared by every page

### 3.1 Loading screen

| Trigger | Effect | Timing |
| --- | --- | --- |
| Load (first visit) | A black full-screen overlay shows the status line, a counter that runs 000 to 100 and a thin cream bar growing left to right. Every other animation on the page is held until it finishes, so the hero entrance plays right after it | Counter 1.5s linear; overlay then fades out 0.6s and is removed after 0.8s. Safety: forced to finish by 3.2s |

### 3.2 Background canvas (behind all content)

| Trigger | Effect | Timing |
| --- | --- | --- |
| Load | The dark background fades in while easing down from a 120% scale | 1s ease-in-out |
| Auto | About 80 translucent glass shards (42 on small screens) drift slowly, rotate and flip as if turning in space. 130 tiny stars twinkle. Two soft white glows on the left and right edges breathe in and out. A dark vignette and fine film grain (7% opacity) sit on top | Continuous, redrawn every frame |
| Mouse move | Shards shift against the pointer (parallax, nearer shards move more) | Eased at 4% per frame |
| Scroll | Scrolling pushes the shards slightly up or down in proportion to scroll speed | Continuous |

### 3.3 Navigation pill

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Whole pill | Load | Drops in from above the screen | 0.9s strong spring, after 0.3s delay |
| Scroll bar and percentage | Scroll | A 2 px cream line along the pill's bottom edge grows with scroll depth; the number beside it counts 0% to 100% | Follows scroll |
| Pill size | Scroll past 140 px | The pill collapses to just logo, percentage and Menu button | 0.7s spring |
| Collapsed pill | Hover or keyboard focus | Re-expands to show the six links (the pill grew from about 250 px to 720 px wide when measured) | 0.7s spring |
| Links | Hover | Soft grey pill appears behind the label and the text turns white; the current page keeps that look permanently. Text roll also plays | 0.3s; roll 0.55s in-out |
| Menu button | Hover | Scales up to 106% and turns cream. Label switches Menu / Close | 0.4s strong spring |
| Logo | Click | Goes to Home | - |

On screens 860 px wide or less the links are hidden; only the logo, Menu button and (above 560 px) the percentage remain.

### 3.4 Menu overlay

| Trigger | Effect | Timing |
| --- | --- | --- |
| Click Menu | Page behind is dimmed and blurred (10 px); a large card drops in from slightly above, growing from 96% to 100%. Page scrolling is locked | Scrim 0.4s; card 0.65s spring |
| Hover a menu link | Link turns cream and slides 10 px right; the small index number (00-06) stays in place; text roll plays | 0.3s colour; 0.4s spring slide |
| Hover the film tile | Tile border turns cream. The tile holds a miniature of the hero artwork: two interlocking rings turning slowly in opposite directions inside a gently moving frame | Border 0.3s; rings 26s and 34s per turn |
| Click the film tile | Closes the menu, goes to Home if needed and scrolls to the Studio film section after about 1.7s | - |
| Hover Start a Project pill | Scales up to 106% | 0.4s strong spring |
| Close | Esc key, click the dimmed area, click any link, or click Close | Reverse of opening |

### 3.5 Page transition (between pages)

| Trigger | Effect | Timing |
| --- | --- | --- |
| Click any page link | A white panel slides up from the bottom of the screen carrying the destination name (for example Services) in large dark type. While it covers the screen the next page is swapped in, scrolled to the top and the browser tab title updates. The panel then exits upward | In 0.58s, swap at 0.58s, out 0.65s - all in-out. Skipped on the very first load |

Tab titles: DecaCorpus | Build What's Next. - Services | DecaCorpus - Healthcare CRM concept | DecaCorpus - The Studio | DecaCorpus - Insights | DecaCorpus - Careers | DecaCorpus - Contact | DecaCorpus.

### 3.6 Custom cursor

| Trigger | Effect |
| --- | --- |
| Mouse move (devices with a mouse) | The normal arrow is hidden and replaced by a small cream teardrop (20 px, tilted 45 degrees, with a thin dark ring) that follows the pointer with a slight lag (it covers 30% of the distance each frame). It appears after the first mouse move and hides when the pointer leaves the window |
| Over links, buttons, inputs, cards | The script still assigns labels (Open, Go, Drag, Preview, Toggle, Jump, Start, Live view, Play, Pause, Type, Pick), but a final CSS override hides the label bubble and stops the cursor from growing, so the cursor looks the same everywhere |

### 3.7 Scroll reveal and counters

| Trigger | Effect | Timing |
| --- | --- | --- |
| Scroll (element 10% visible) | Fade-up reveal as described in 2.2. Items already on screen at load are revealed automatically after 1.8s; if scripts fail, everything is shown without animation | 0.9s smooth-out |
| Scroll (stat panels) | Numbers (128, 24, 08) count up from 0 with an ease-out curve | 1.1s |

### 3.8 Smooth scrolling and scroll-through navigation

| Trigger | Effect |
| --- | --- |
| Scroll wheel or trackpad | If the Lenis library loads, scrolling is smoothed (1.15s exponential ease-out); links to on-page anchors glide with a 70 px top offset. Scrolling is paused while the menu or drawer is open. Without the library the browser's own smooth scrolling is used |
| Keep scrolling past the bottom of any page | A 4 px cream bar along the page bottom fills as you keep rolling the wheel (it needs about 900 px of wheel movement); at 100% the next page opens automatically. Order: Home, Services, Work, Studio, Insights, Careers, Contact, then back to Home. Rolling back up drains the bar. The text label for this bar is hidden, so only the bar is visible |

### 3.9 Footer

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Footer links (Studio, Services, Reach us columns) | Hover | Text brightens from silver to cream; text roll plays | 0.2s; roll 0.55s |
| Bottom links (Privacy, Terms) | Hover | Text brightens to cream | 0.2s |
| Services column links | Click | Opens the service detail drawer (section 5.4) on the current page instead of navigating | Drawer 0.65s |
| Giant DECACORPUS wordmark | - | Static solid white text that fades out toward the bottom edge | - |

### 3.10 Keyboard and accessibility

| Trigger | Effect |
| --- | --- |
| Tab focus on any control | 2 px white outline, 3 px offset |
| Esc | Closes the menu and the service drawer; focus returns to the element that opened the drawer |
| Cards, chips, tabs, filter buttons | Real buttons (activate with Enter or Space); service cards show their hover effect on keyboard focus too |

## 4. Home page

Shared behaviour (loader, nav, menu, cursor, reveals, footer) is in section 3 and applies here too.

### 4.1 Hero

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Eyebrow line | Load | Fades in | 0.8s ease, delay 0.5s |
| H1 words (Build / what's / next.) | Load | Each word fades in while rising 10 px, one after another | 0.5s each, delays 0.4s, 0.6s, 0.8s |
| Text block, buttons, slideshow | Load | Fade-up in sequence (text, then buttons, then slideshow rises 6 px) | 0.5s ease-out, delays about 0.9s, 1.1s, 1.3s |
| Ambient glow behind the title | Auto | A large soft light slowly drifts diagonally and back | 14s ease-in-out, alternating, endless |
| Floating chips (Web, AI, SaaS) | Load | Drop in from 100 px above or below with a slight bounce | 1.2s spring, delay 0.8s |
| Floating chips | Auto | Bob up and down about 10 px, each on its own offset | 6s ease-in-out, endless |
| Floating chips | Hover | Fill turns cream, text turns ink and the chip grows to 125% | 0.4s strong spring |
| Sticker "Systems, not silos." | Auto | Tilted at -7 degrees and bobbing 8 px | 5s ease-in-out, endless |
| Sticker | Hover | Swings to +3 degrees and grows to 112% | 0.5s strong spring |
| Round arrow button | Hover | Rotates 45 degrees and grows to 110% | 0.5s strong spring |
| Round arrow button | Click | Goes to Contact | - |
| Start a Project / See the concept | Hover, Click | Standard button hover (2.2). Start a Project goes to Contact; See the concept goes to Work | 0.4s spring |
| Title and content block | Scroll | Title drifts up at 8% of scroll speed, the text/slideshow row at 6%, the whole hero fades out as you scroll through it, and the slideshow shrinks slightly (to 92% by 400 px of scroll) | Follows scroll |

### 4.2 Hero slideshow

| Trigger | Effect | Timing |
| --- | --- | --- |
| Auto | Advances every 6 seconds and loops. Five thin progress segments along the top fill left to right for the current slide; finished slides stay full | 6s per slide |
| Slide change | The old slide fades out while the new one fades in; the new slide's label, code and caption rise 24 px one after another, and the artwork rises 0.9s | Crossfade 0.7s; text 0.8s smooth-out, 0.08s steps |
| Hover or focus inside | Autoplay pauses and resumes when the pointer leaves | - |
| Click a progress segment | Jumps to that slide | - |
| Click the left or right arrow | Previous or next slide (wraps around). On hover the arrow button's border and arrow turn cream | 0.2s |
| Click the left third or right third of the slide | Previous or next slide | - |
| Drag or swipe more than 50 px | Previous (drag right) or next (drag left) | - |
| Slide 2 | Shows the live Healthcare CRM dashboard scaled to fit; its tabs react to clicks (section 4.5) | - |

### 4.3 The bigger picture

| Trigger | Effect |
| --- | --- |
| Scroll | Panel and text reveal (fade-up). No hover or click behaviour |

### 4.4 Made around you (picker)

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Service chips | Hover | Lift 2 px, outline turns cream; the icon tile tilts -8 degrees and grows to 108% | 0.25s; icon 0.35s |
| Service chips | Click | The chip turns white with dark text and a white glow; its icon tile turns black. The result card on the right swaps content and every line fades up in turn. The choice is remembered in the browser and later pre-fills the "What do you want to build?" answer in the Contact form | Card content 0.6s smooth-out |
| Result card button "Read the overview" | Click | Opens the service drawer (section 5.4) | Drawer 0.65s |
| Result card button "Start a ... project" | Click | Goes to Contact | - |
| Result card | Load | Shows the remembered choice, or Website the first time | - |

### 4.5 What we build (service cards) and Selected concept

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Service cards (8) | Scroll | Reveal one after another, 0.06s apart | 0.9s smooth-out |
| Service cards | Hover or keyboard focus | Card lifts 6 px, border brightens from #2a2a28 to #6a6860, a soft shadow appears, a faint light glow fades in from the top-right, the icon rises 3 px, and the arrow circle fills cream with an ink arrow and rotates 45 degrees | 0.35-0.45s smooth-out |
| Cream card "Not sure where to start?" | Hover | Background and border turn from cream to white, lifts 6 px; arrow circle fills ink. Click goes to Contact | 0.35s |
| Service cards | Click | Opens the service drawer (section 5.4) | 0.65s |
| Explore services button | Click | Goes to Services | 0.4s spring |
| Healthcare CRM dashboard | Scroll | Starts at 88% size and grows continuously to 100% as it reaches the screen | Follows scroll |
| Healthcare CRM dashboard | Reveal | Numbers count up (128, 24, 08) and the week bars grow from the bottom | Counters 1.1s; bars 1s smooth-out |
| Healthcare CRM dashboard | Mouse move | The whole panel tilts toward the pointer (about 2.5 degrees sideways, 2 degrees up/down) and settles flat when the pointer leaves | Follows pointer |
| Sidebar tabs | Hover | Border turns cream, text turns white and indents slightly | 0.25s |
| Sidebar tabs | Click | The clicked tab turns cream-filled; the week chart redraws with a different highlighted day (a different bar lights up for each tab) | Bars regrow 1s |
| Stat tiles | Hover | Border turns cream, tile lifts 3 px | 0.3s |
| Chart bars | Hover | Bar brightens by 25% | 0.2s |
| Patient workflow rows | Hover | Row gets a lighter background and the text indents from 8 to 16 px | 0.25s |

### 4.6 Our philosophy

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Headline "Technology should feel simple." | Auto and Scroll | Silver-white gradient text with a bright highlight that sweeps across it repeatedly; the gradient's vertical position also moves as you scroll | Sweep 6s ease-in-out, endless |
| Statement ("Behind every interface...") | Scroll | Every word starts at 16% opacity and lights up to full white one by one, left to right, as the paragraph moves up through the screen | 0.5s per word |
| Trio rows (Business, System, Interface) | Hover | Row background lightens, text turns white and the row indents from 26 to 34 px; it also tilts about -2 degrees (a leftover from an older style) | 0.35s |
| Meet the studio button | Click | Goes to Studio | 0.4s spring |

### 4.7 How we get there (scroll-driven process)

This section is 5.6 screens tall on desktop (4 on mobile) and its content stays pinned while you scroll through it.

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Whole section | Scroll | The scroll distance is split into six equal zones; each zone selects one step (Idea ... Evolve) | Follows scroll |
| Step list (left) | Scroll | The current step turns cream and indents 8 px; finished steps become lighter grey with a filled dot; upcoming steps stay dark grey. A thin vertical line grows down the list to the current step | List 0.3s; line 0.5s |
| Step panel (right) | Scroll | The old step fades out while the new one fades in and rises 30 px; the huge ghost word behind changes to the step name at once | Fade 0.5s, rise 0.7s smooth-out |
| Step list items | Hover | Text turns white | 0.3s |
| Step list items | Click | The page scrolls to that step's zone | Smooth scroll |
| Step selector pill (top centre) | Click | Opens a dropdown that scales from 92% to 100% while fading in; the caret flips 180 degrees. Clicking a step scrolls to it; clicking elsewhere closes it | 0.45s spring; caret 0.4s |
| Step selector pill | Hover | Border turns cream | 0.3s |
| Dropdown items | Hover | Background lightens, text turns white | 0.2s |
| On screens 860 px or less | - | The list becomes a row of equal tabs | - |

### 4.8 Built on strong foundations (technology)

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Technology columns (4) | Auto | Each column is an endless vertical conveyor of pills; Frontend and Infrastructure move up, Backend and Design move down. The top and bottom 22% fade out. On small screens the columns become horizontal rows that scroll sideways | 16s per loop, linear (24s on mobile) |
| Column | Hover | The conveyor pauses | - |
| Pill | Hover | Fill turns cream, text turns ink and the pill nudges 6 px right | 0.3s |

### 4.9 A different perspective (article cards)

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Cards (2) | Scroll | Reveal one after another | 0.9s smooth-out |
| Cards | Hover | Card lifts 4 px, a deep shadow appears and the photo zooms in to 104% | Lift 0.35s; photo 0.8s smooth-out |
| Cards | Click | Nothing happens (they are previews with no linked article); they can be focused with the keyboard | - |
| Explore Insights button | Click | Goes to Insights | 0.4s spring |

### 4.10 Studio film preview

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Film frame | Hover | Border turns cream | 0.3s |
| Play button (centre) | Hover | Fills cream with an ink symbol | 0.3s |
| Play button or Watch preview button | Click | Toggles play and pause; the symbol switches between a triangle and a pause icon. While "playing": a soft light beam sweeps across the frame, a thin scan line travels down it, the bottom progress line fills in 24 seconds and the timestamp counts 0:00 to 0:24 (then loops). Pausing freezes the animations | Beam 9s ease-in-out alternate; scan line 5s linear loop; progress 24s linear; timestamp 1s ticks |
| Watch preview button | Hover | Standard ghost button hover | 0.4s spring |

There is no real video: the caption says "Video preview - footage pending."

### 4.11 FAQ

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Question rows | Hover | Text indents 10 px | 0.4s spring |
| Question rows | Click | Toggles that answer open or closed (several can be open at once). The plus icon rotates 45 degrees into a cross and the answer expands smoothly from zero height | Icon and expand 0.4s spring |

### 4.12 Closing CTA and section dots

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| CTA band | Scroll | Eyebrow, heading and button row reveal | 0.9s smooth-out |
| Start a Project button | Hover, Click | Standard button hover; goes to Contact | 0.4s spring |
| Email link | Hover | Text roll; opens an email to hello@decacorpus.com on click | 0.55s in-out |
| Section dots (right edge, desktop above 1180 px wide) | Scroll | Fade in after about 420 px of scrolling; the dot for the section at the top half of the screen is highlighted | - |
| Section dots | Hover or active | Dot grows to 160% and turns cream; its label slides in from the right | 0.35s |
| Section dots | Click | Scrolls to that section | Smooth scroll |

## 5. Services page

### 5.1 Landing: service grid

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Eyebrow and H1 | Load / Scroll | Fade-up reveal | 0.9s smooth-out |
| Service cards (7 + cream card) | Load | Reveal one after another, 0.06s apart | 0.9s smooth-out |
| Service cards | Hover or keyboard focus | Same as Home 4.5: lift 6 px, border brightens, shadow, top-right glow, icon rises 3 px, arrow circle fills cream and rotates 45 degrees | 0.35-0.45s smooth-out |
| Service cards | Click | Opens the service drawer (5.4) | 0.65s |
| Cream card "Not sure where to start?" | Hover | Turns white and lifts 6 px; arrow circle fills ink | 0.35s |
| Cream card | Click | Goes to Contact | - |

On desktop the grid is stretched to fill one screen height (4 columns, 2 rows). Below 1100 px it becomes 2 columns, below 560 px a single column.

### 5.2 One connected engagement

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Eyebrow and H2 | Scroll | Fade-up reveal | 0.9s smooth-out |
| Four steps (Discover, Shape, Deliver, Improve) | Scroll | Reveal left to right, 0.08s apart | 0.9s smooth-out |
| Steps | Hover | The thin line above the step turns from grey to cream | 0.35s |

### 5.3 Closing CTA

Same behaviour as Home 4.12 (button hover, email text roll).

### 5.4 Service detail drawer

| Trigger | Effect | Timing |
| --- | --- | --- |
| Open: click a service card (Home or Services), the "Read the overview" button on Home, or any service link in the footer | A dark scrim (about 70% black) fades in and a panel slides in from the right edge (580 px wide, full width on phones) with a slight overshoot. The page behind stops scrolling and the panel starts at its top; keyboard focus jumps to the Close button. The chosen service is also remembered and pre-fills the Contact form and the Home picker | Scrim 0.4s; panel 0.65s drawer spring |
| Scroll inside the drawer | The drawer scrolls on its own; the page behind does not move | - |
| Hover Close | Border and text turn cream | 0.25s |
| Close: Close button, Esc key, click on the dark area | Panel slides out, scrim fades, page scrolling resumes and focus returns to the element that opened it | 0.65s |
| Click "Start a Project" in the drawer | Closes the drawer and goes to Contact | 0.4s spring on the button |

## 6. Work page

### 6.1 Landing: Healthcare CRM concept

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Eyebrow, H1, lead, tags, disclaimer | Load | Fade-up reveal, one after another | 0.9s smooth-out |
| Tags (Custom CRM, Automation, Analytics) | Hover | Border and text turn cream, tag lifts 2 px | 0.3s |
| Dashboard | Scroll | Grows from 88% to 100% as it comes into view | Follows scroll |
| Dashboard | Reveal | Numbers count up; week bars grow from the bottom | Counters 1.1s; bars 1s smooth-out |
| Dashboard | Mouse move | Tilts toward the pointer and settles flat on leave | Follows pointer |
| Sidebar tabs | Hover / Click | Hover: border cream, text white. Click: tab fills cream and the chart highlights a different day | 0.25s; bars 1s |
| Stat tiles | Hover | Border cream, lift 3 px | 0.3s |
| Chart bars | Hover | Brighten 25% | 0.2s |
| Workflow table rows | Hover | Lighter background; text indents 8 to 16 px | 0.25s |

The script contains a rotating highlight for a workflow list on this page, but the matching element no longer exists, so it does not run.

### 6.2 Closing CTA

Same behaviour as Home 4.12.

## 7. Studio page

### 7.1 Landing

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Eyebrow, H1, lead, button, illustration | Load | Fade-up reveal in sequence | 0.9s smooth-out |
| Join the team (white pill) | Hover | Lifts 2 px and fades to 78% | 0.4s spring |
| Join the team | Click | Goes to Careers | - |
| Culture illustration tile | Hover | No hover effect (reveal only) | - |

### 7.2 Our philosophy and How we work

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| White philosophy panel | Scroll | Fade-up reveal. No hover behaviour | 0.9s smooth-out |
| Three cards (Iterative, Radically transparent, Uncompromising on quality) | Scroll | Reveal one after another | 0.9s smooth-out |
| Cards | Hover | Card lifts 3 px and its border brightens from #262624 to #4a4a46; the icon tile fills cream, the icon turns ink and the tile tilts -6 degrees | Card 0.3-0.4s smooth-out; icon 0.35s |
| Cards | Click | Nothing | - |

### 7.3 Closing CTA

Same behaviour as Home 4.12.

## 8. Insights page

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Eyebrow, H1, lead | Load | Fade-up reveal | 0.9s smooth-out |
| Filter buttons (All perspectives, AI, Design) | Hover | Outline turns cream | 0.3s |
| Filter buttons | Click | The clicked button fills cream with ink text. Cards that do not match disappear instantly (no animation) and the counter changes, for example to "01 Editorial preview / No articles published yet". "All perspectives" brings both cards back and the counter returns to "02 Editorial previews ..." | Instant |
| Article cards | Scroll | Reveal one after another | 0.9s smooth-out |
| Article cards | Hover | Lift 4 px, deep shadow, photo zooms in to 104% | Lift 0.35s; photo 0.8s smooth-out |
| Article cards | Click | Nothing (previews only); focusable with the keyboard | - |
| Poll options (before voting) | Hover | Outline turns cream and the option lifts 4 px | 0.35s spring |
| Poll options | Click | The vote is stored in the browser and remembered on later visits. The chosen option fills cream with ink text, the other dims to 45% and both become disabled, and the hint changes to "Noted. We'll weigh it when we start writing." A second vote is not possible | Instant; colours 0.35s |

This page has no closing CTA band, so its bottom edge goes straight to the footer.

## 9. Careers page

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Landing screen | Load | Fills the full screen height; eyebrow, H1, lead and the two buttons fade up in sequence | 0.9s smooth-out |
| Write to us / Introduce yourself | Hover, Click | Standard button hover; opens an email to careers@decacorpus.com (Introduce yourself adds the subject "Introduction") | 0.4s spring |
| Why DecaCorpus cards (3) | Scroll | Reveal one after another | 0.9s smooth-out |
| Why DecaCorpus cards and role cards (4) | Hover | Lift 3 px, border brightens to #4a4a46; for role cards the icon tile fills cream, the icon turns ink and the tile tilts -6 degrees | Card 0.3-0.4s; icon 0.35s |
| Apply buttons (x4) | Hover, Click | Standard button hover; opens an email with the subject "Interest in \[role\]" | 0.4s spring |
| Open-invitation panel | Scroll | Fade-up reveal | 0.9s smooth-out |
| Email pill careers@decacorpus.com | Hover | Lifts 2 px and its background lightens from #0a0a0a to #1c1c1b | 0.3s |

## 10. Contact page

| Element | Trigger | Effect | Timing |
| --- | --- | --- | --- |
| Eyebrow, H1, left column, form card | Load | Fade-up reveal in sequence | 0.9s smooth-out |
| Email link hello@decacorpus.com | Click | Opens an email. It has no visible hover effect (an older underline colour change was removed by a later override) | - |
| Question heading | Each step | Fades up when the question changes | 0.5s |
| Progress bar (six segments) | Each step | Segments up to the current step fill ink; the others stay pale | 0.5s |
| Step counter | Each step | Updates from 01 / 06 to 06 / 06 | Instant |
| Answer field | Focus | Bottom line thickens from 1.5 px to 3 px | 0.25s |
| Answer field | Keyboard (Enter) | Same as pressing Next | - |
| Next button | Click | Saves the answer, moves to the next question and puts the cursor in the new field. On the last step the label becomes Send | 0.4s spring on hover |
| Previous button | Hover | Text darkens to ink and shifts 4 px left | 0.25s |
| Previous button | Click | Returns to the previous question with the saved answer. Disabled (30% opacity) on step 1 | - |
| Step 4 field | Load | Pre-filled with the service picked on Home or in a drawer (for example "Website") | - |
| Send | Click | The form is replaced by "Thanks, \[name\]. We'll be in touch." and the note "This prototype doesn't send messages yet." Nothing is transmitted. There is no validation: empty answers are accepted | Instant |

## 11. Unused effects and observations

### 11.1 Effects that exist in the code but are not visible

| Effect | Why it does not show |
| --- | --- |
| Cursor label bubble and the cursor growing into a large circle | Disabled by a CSS override; the cursor stays a small teardrop |
| Preview card that follows the pointer over service rows | The service rows it was built for were replaced by the card grid |
| Rotating workflow highlight on the Work page | The element it targets is no longer on the page |
| Scrolling outline-text bands and serif quote ticker | Not present in any page markup |
| Hand-drawn underline under "next." in the Home title | The CSS is present, but the SVG line it animates is not in the markup |
| Footer wordmark light shimmer tied to scroll | The script still runs, but the gradient it moves was removed, so the wordmark is solid white |
| Helper hints under each form question | Defined in the script but never displayed |
| Hover cursor labels such as Open, Drag, Preview | Hidden together with the label bubble |

### 11.2 Observations

- **Always-on canvas**: the glass-shard background redraws every frame on all pages. It is switched to a single still frame when the user prefers reduced motion; on low-power devices it is the first thing to check if scrolling feels heavy.
- **Slideshow control**: the Home slideshow pauses only while the pointer or keyboard focus is inside it. There is no visible pause button, which is worth adding if accessibility standards are a goal.
- **Scroll-through to the next page** works with a mouse wheel or trackpad only; it has no touch equivalent.
- **Hover-only extras are hidden on phones**: the floating chips, the nav links, the section dots and the film tile in the menu are not shown on narrow screens, where the Menu button is the single navigation control.
- **Cards that look clickable but are not**: the two article cards (Home and Insights) and the three culture cards (Studio) lift on hover but have no link.
