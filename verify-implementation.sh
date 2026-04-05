#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Send Report via Email - Verification${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Track results
PASSED=0
FAILED=0

# Function to check and print result
check_item() {
    local name="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $name"
        ((FAILED++))
    fi
}

echo -e "${YELLOW}1. Checking Node Modules...${NC}"
cd backend/express 2>/dev/null || { echo "Backend directory not found"; exit 1; }

check_item "resend installed" "npm list resend 2>/dev/null | grep -q resend"
check_item "cloudinary installed" "npm list cloudinary 2>/dev/null | grep -q cloudinary"
check_item "puppeteer installed" "npm list puppeteer 2>/dev/null | grep -q puppeteer"

echo ""
echo -e "${YELLOW}2. Checking Backend Files...${NC}"

check_item "email.service.js exists" "test -f src/services/email.service.js"
check_item "report.controller.js updated" "grep -q 'sendReportViaEmail' src/controllers/report.controller.js"
check_item "report.routes.js updated" "grep -q 'send-email' src/routes/report.routes.js"
check_item "package.json has resend" "grep -q '\"resend\"' package.json"

echo ""
echo -e "${YELLOW}3. Checking Frontend Files...${NC}"

check_item "Report.jsx has Send Email" "grep -q 'handleSendEmail' ../../frontend/src/pages/Report.jsx"
check_item "Report.jsx imports axios" "grep -q 'import axios' ../../frontend/src/pages/Report.jsx"

echo ""
echo -e "${YELLOW}4. Checking Environment Variables...${NC}"

check_item "env.local exists" "test -f env.local"
check_item "RESEND_API_KEY configured" "grep -q 'RESEND_API_KEY' env.local"
check_item "RESEND_FROM_EMAIL configured" "grep -q 'RESEND_FROM_EMAIL' env.local"

echo ""
echo -e "${YELLOW}5. Checking File Syntax...${NC}"

check_item "email.service.js syntax" "node -c src/services/email.service.js 2>/dev/null"
check_item "report.controller.js syntax" "node -c src/controllers/report.controller.js 2>/dev/null"
check_item "report.routes.js syntax" "node -c src/routes/report.routes.js 2>/dev/null"

echo ""
echo -e "${YELLOW}6. Checking Documentation...${NC}"

check_item "QUICK_START.md exists" "test -f ../../QUICK_START.md"
check_item "SENDREPORT_EMAIL_SETUP.md exists" "test -f ../../SENDREPORT_EMAIL_SETUP.md"
check_item "IMPLEMENTATION_SUMMARY.md exists" "test -f ../../IMPLEMENTATION_SUMMARY.md"
check_item "DETAILED_CHANGELOG.md exists" "test -f ../../DETAILED_CHANGELOG.md"

echo ""
echo -e "${YELLOW}7. Checking Service File Content...${NC}"

check_item "Resend import" "grep -q \"import { Resend } from 'resend'\" src/services/email.service.js"
check_item "Puppeteer import" "grep -q 'import puppeteer' src/services/email.service.js"
check_item "Cloudinary import" "grep -q 'import { v2 as cloudinary }' src/services/email.service.js"
check_item "sendReportToAllParents function" "grep -q 'export const sendReportToAllParents' src/services/email.service.js"

echo ""
echo -e "${YELLOW}8. Checking Controller Updates...${NC}"

check_item "Prisma import in controller" "grep -q 'import { PrismaClient }' src/controllers/report.controller.js"
check_item "Email service import" "grep -q 'email.service.js' src/controllers/report.controller.js"
check_item "sendReportViaEmail export" "grep -q 'export.*sendReportViaEmail' src/controllers/report.controller.js"

echo ""
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"

TOTAL=$((PASSED + FAILED))
echo -e "Total Checks: ${BLUE}${TOTAL}${NC}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All checks passed! Implementation is complete.${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Update env.local with your Resend API key"
    echo "2. Verify parent emails exist in database"
    echo "3. Run: npm start"
    echo "4. Test the Send Email button"
    exit 0
else
    echo -e "\n${RED}✗ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
