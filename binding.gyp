{
  "targets": [
    {
		"target_name": "crypto",
		"sources": [
			"src/common.cc", "src/crypto.cc"
		],
		'include_dirs': [
        		"<!(node -e \"require('nan')\")"
      		]
    }
  ]
}