
const fs = require('fs');
const path = 'src/pages/admin/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the extra div in Column 2 / Grid / Main block end
// Search for the 5 closing divs before the buttons flex div
const pattern1 = /<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<div className="flex justify-between items-center/;
content = content.replace(pattern1, (match) => {
    return '</div>\n                                                                </div>\n                                                            </div>\n                                                        </div>\n\n                                                        <div className="flex justify-between items-center';
});

// Fix the extra/misaligned div before DialogContent
const pattern2 = /\)}\s+<\/div>\s+<\/DialogContent>/;
content = content.replace(pattern2, ')}\n                                            </div>\n                                        </DialogContent>');

// Fix the extra div around 3954-3955 if it exists
// content = content.replace(/<\/Dialog>\s+<\/div>\s+<\/div>\s+\)}/, '</Dialog>\n                                </div>\n                            )}');

fs.writeFileSync(path, content);
console.log('Fixed Dashboard.tsx');
