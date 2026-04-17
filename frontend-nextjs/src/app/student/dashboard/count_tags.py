import re

with open('SubjectDetail.tsx', 'r') as f:
    content = f.read()

# Simple tag counter
tags = re.findall(r'<(div|section|span|p|h1|h3|button|select|ResponsiveContainer|LineChart|Line|XAxis|YAxis|CartesianGrid|Tooltip|tr|th|td|table|thead|tbody|option)', content)
closing_tags = re.findall(r'</(div|section|span|p|h1|h3|button|select|ResponsiveContainer|LineChart|Line|XAxis|YAxis|CartesianGrid|Tooltip|tr|th|td|table|thead|tbody|option)', content)
self_closing = re.findall(r'<[^>]*/>', content)

print(f"Opening: {len(tags)}")
print(f"Closing: {len(closing_tags)}")
print(f"Self-closing: {len(self_closing)}")

for tag in set(tags + closing_tags):
    o = content.count(f'<{tag}')
    c = content.count(f'</{tag}')
    if o != c:
        print(f"Mismatch in {tag}: {o} vs {c}")
